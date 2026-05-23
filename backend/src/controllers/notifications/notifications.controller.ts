import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../../types/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getAll(@CurrentUser() user: RequestUser) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        companyId: user.companyId,
        OR: [{ userId: user.id }, { userId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { success: true, data: notifications };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.prisma.notification.updateMany({
      where: { id, companyId: user.companyId },
      data: { isRead: true },
    });
    return { success: true, message: 'Notification marked as read' };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(@CurrentUser() user: RequestUser) {
    await this.prisma.notification.updateMany({
      where: {
        companyId: user.companyId,
        OR: [{ userId: user.id }, { userId: null }],
        isRead: false,
      },
      data: { isRead: true },
    });
    return { success: true, message: 'All notifications marked as read' };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: RequestUser) {
    const count = await this.prisma.notification.count({
      where: {
        companyId: user.companyId,
        OR: [{ userId: user.id }, { userId: null }],
        isRead: false,
      },
    });
    return { success: true, data: { count } };
  }
}
