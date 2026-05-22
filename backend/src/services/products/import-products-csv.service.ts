import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import { UserRole } from '@prisma/client';

interface CsvProduct {
  'Product Name': string;
  SKU: string;
  Barcode?: string;
  Category?: string;
  Supplier?: string;
  'Cost Price': string;
  'Selling Price': string;
  'Stock Quantity': string;
  'Reorder Level': string;
  Unit?: string;
  'Expiry Date'?: string;
  'Shelf Number'?: string;
  'Shelf Row'?: string;
}

@Injectable()
export class ImportProductsCsvService {
  constructor(private prisma: PrismaService) {}

  async execute(companyId: string, buffer: Buffer, userId: string, userRole: UserRole) {
    let records: CsvProduct[];
    try {
      records = parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
    } catch {
      throw new BadRequestException('Invalid CSV format');
    }

    if (!records.length) throw new BadRequestException('CSV file is empty');

    const isAdmin = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);
    const approvalStatus = isAdmin ? 'ACTIVE' : 'PENDING_APPROVAL';

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const record of records) {
      try {
        const name = record['Product Name']?.trim();
        const sku = record['SKU']?.trim();
        if (!name || !sku) {
          results.errors.push(`Row skipped: missing Product Name or SKU`);
          results.skipped++;
          continue;
        }

        const existing = await this.prisma.product.findUnique({
          where: { companyId_sku: { companyId, sku } },
        });
        if (existing) {
          results.errors.push(`SKU "${sku}" already exists - skipped`);
          results.skipped++;
          continue;
        }

        let categoryId: string | undefined;
        if (record.Category) {
          const cat = await this.prisma.category.upsert({
            where: { companyId_name: { companyId, name: record.Category } },
            create: { companyId, name: record.Category },
            update: {},
          });
          categoryId = cat.id;
        }

        let supplierId: string | undefined;
        if (record.Supplier) {
          const sup = await this.prisma.supplier.findFirst({
            where: { companyId, name: { equals: record.Supplier, mode: 'insensitive' } },
          });
          if (sup) supplierId = sup.id;
        }

        const costPrice = parseFloat(record['Cost Price']) || 0;
        const sellingPrice = parseFloat(record['Selling Price']) || 0;
        const currentStock = parseInt(record['Stock Quantity']) || 0;

        await this.prisma.product.create({
          data: {
            companyId,
            createdById: userId,
            approvedById: isAdmin ? userId : undefined,
            approvedAt: isAdmin ? new Date() : undefined,
            name,
            sku,
            barcode: record.Barcode || undefined,
            categoryId,
            supplierId,
            costPrice,
            sellingPrice,
            openingStock: currentStock,
            currentStock,
            reorderLevel: parseInt(record['Reorder Level']) || 0,
            unit: record.Unit || 'pcs',
            expiryDate: record['Expiry Date'] ? new Date(record['Expiry Date']) : undefined,
            shelfNumber: record['Shelf Number'],
            shelfRow: record['Shelf Row'],
            approvalStatus,
          },
        });

        results.created++;
      } catch (e) {
        results.errors.push(`Error processing row: ${e instanceof Error ? e.message : 'Unknown error'}`);
        results.skipped++;
      }
    }

    return results;
  }
}
