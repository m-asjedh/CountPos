import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterCompanyDto } from '../../dtos/auth/register-company.dto';
import * as bcrypt from 'bcryptjs';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

@Injectable()
export class RegisterCompanyService {
  constructor(private prisma: PrismaService) {}

  async execute(dto: RegisterCompanyDto) {
    const existingCompany = await this.prisma.company.findUnique({
      where: { email: dto.companyEmail },
    });
    if (existingCompany) {
      throw new ConflictException('A company with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    let slug = slugify(dto.companyName);

    const existing = await this.prisma.company.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        slug,
        email: dto.companyEmail,
        phone: dto.companyPhone,
        address: dto.companyAddress,
        settings: {
          create: {},
        },
        users: {
          create: {
            email: dto.email,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: 'OWNER',
            isActive: true,
          },
        },
      },
      include: {
        users: { select: { id: true, email: true, role: true } },
        settings: true,
      },
    });

    return {
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        slug: company.slug,
      },
      user: company.users[0],
    };
  }
}
