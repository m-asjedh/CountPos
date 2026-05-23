import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { UserRole, ApprovalStatus } from '@prisma/client';
import {
  decodePriceValue,
  parseDiscountPercent,
  PriceCodeMapping,
} from '../../utils/price-code.util';

type ImportRow = Record<string, string | number | undefined>;

interface NormalizedRow {
  name: string;
  sku: string;
  costPrice: number;
  currentStock: number;
  maxDiscountPercent?: number;
  barcode?: string;
  category?: string;
  supplier?: string;
  sellingPrice?: number;
  reorderLevel?: number;
  unit?: string;
  expiryDate?: string;
  shelfNumber?: string;
  shelfRow?: string;
}

@Injectable()
export class ImportProductsCsvService {
  constructor(private prisma: PrismaService) {}

  async execute(
    companyId: string,
    buffer: Buffer,
    userId: string,
    userRole: UserRole,
    filename?: string,
  ) {
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId },
    });

    const priceMapping: PriceCodeMapping | null =
      settings?.priceCodeWord && settings?.priceCodeDigits
        ? { word: settings.priceCodeWord, digits: settings.priceCodeDigits }
        : null;

    const rows = this.parseFile(buffer, filename);
    if (!rows.length) throw new BadRequestException('File is empty');

    const isAdmin = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);
    const approvalStatus: ApprovalStatus = isAdmin
      ? 'ACTIVE'
      : 'PENDING_APPROVAL';

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      try {
        const normalized = this.normalizeRow(rows[i], priceMapping);
        if (!normalized) {
          results.skipped++;
          continue;
        }

        const existing = await this.prisma.product.findUnique({
          where: { companyId_sku: { companyId, sku: normalized.sku } },
        });
        if (existing) {
          results.errors.push(
            `Row ${rowNum}: SKU "${normalized.sku}" already exists`,
          );
          results.skipped++;
          continue;
        }

        let categoryId: string | undefined;
        if (normalized.category) {
          const cat = await this.prisma.category.upsert({
            where: { companyId_name: { companyId, name: normalized.category } },
            create: { companyId, name: normalized.category },
            update: {},
          });
          categoryId = cat.id;
        }

        let supplierId: string | undefined;
        if (normalized.supplier) {
          const sup = await this.prisma.supplier.findFirst({
            where: {
              companyId,
              name: { equals: normalized.supplier, mode: 'insensitive' },
            },
          });
          if (sup) supplierId = sup.id;
        }

        const sellingPrice = normalized.sellingPrice ?? normalized.costPrice;

        await this.prisma.product.create({
          data: {
            companyId,
            createdById: userId,
            approvedById: isAdmin ? userId : undefined,
            approvedAt: isAdmin ? new Date() : undefined,
            name: normalized.name,
            sku: normalized.sku,
            barcode: normalized.barcode,
            categoryId,
            supplierId,
            costPrice: normalized.costPrice,
            sellingPrice,
            openingStock: normalized.currentStock,
            currentStock: normalized.currentStock,
            reorderLevel: normalized.reorderLevel ?? 0,
            unit: normalized.unit || 'pcs',
            expiryDate: normalized.expiryDate
              ? new Date(normalized.expiryDate)
              : undefined,
            shelfNumber: normalized.shelfNumber,
            shelfRow: normalized.shelfRow,
            approvalStatus,
            discountEnabled: (normalized.maxDiscountPercent ?? 0) > 0,
            maxDiscountPercent: normalized.maxDiscountPercent ?? 0,
          },
        });

        results.created++;
      } catch (e) {
        results.errors.push(
          `Row ${rowNum}: ${e instanceof Error ? e.message : 'Unknown error'}`,
        );
        results.skipped++;
      }
    }

    return results;
  }

  private parseFile(buffer: Buffer, filename?: string): ImportRow[] {
    const isXlsx =
      filename?.toLowerCase().endsWith('.xlsx') ||
      filename?.toLowerCase().endsWith('.xls');

    if (isXlsx) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new BadRequestException('Excel file has no sheets');
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json<ImportRow>(sheet, {
        defval: '',
        raw: false,
      });
    }

    try {
      return parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      throw new BadRequestException('Invalid CSV format');
    }
  }

  private normalizeRow(
    record: ImportRow,
    priceMapping: PriceCodeMapping | null,
  ): NormalizedRow | null {
    const get = (...keys: string[]): string => {
      for (const key of keys) {
        const found = Object.keys(record).find(
          (k) => k.trim().toLowerCase() === key.toLowerCase(),
        );
        if (
          found != null &&
          record[found] != null &&
          String(record[found]).trim() !== ''
        ) {
          return String(record[found]).trim();
        }
      }
      return '';
    };

    const name = get('Product Name', 'Product name', 'product name', 'Name');
    const sku = get('SKU', 'Uni Code', 'Uni code', 'Code', 'uni code');
    if (!name || !sku) return null;

    const priceRaw = get('Cost Price', 'Cost price', 'Price', 'price');
    const costPrice = decodePriceValue(priceRaw, priceMapping);

    const qtyRaw = get('Stock Quantity', 'Quantity', 'Qty', 'quantity');
    const currentStock = parseInt(qtyRaw.replace(/[^\d]/g, ''), 10) || 0;

    const discountRaw = get('Discount', 'discount');
    const maxDiscountPercent = parseDiscountPercent(discountRaw, priceMapping);

    const sellingRaw = get('Selling Price', 'Selling price');
    const sellingPrice = sellingRaw
      ? decodePriceValue(sellingRaw, priceMapping)
      : undefined;

    return {
      name,
      sku,
      costPrice,
      currentStock,
      maxDiscountPercent,
      barcode: get('Barcode', 'barcode') || undefined,
      category: get('Category', 'category') || undefined,
      supplier: get('Supplier', 'supplier') || undefined,
      sellingPrice,
      reorderLevel: parseInt(get('Reorder Level', 'Reorder level'), 10) || 0,
      unit: get('Unit', 'unit') || undefined,
      expiryDate: get('Expiry Date', 'Expiry date') || undefined,
      shelfNumber: get('Shelf Number', 'Shelf number') || undefined,
      shelfRow: get('Shelf Row', 'Shelf row') || undefined,
    };
  }
}
