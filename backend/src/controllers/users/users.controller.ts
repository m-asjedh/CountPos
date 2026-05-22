import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateUserDto } from '../../dtos/users/create-user.dto';
import { UpdateUserDto } from '../../dtos/users/update-user.dto';
import { CreateUserService } from '../../services/users/create-user.service';
import { GetUsersService } from '../../services/users/get-users.service';
import { UpdateUserService } from '../../services/users/update-user.service';
import { RequestUser } from '../../types/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private createUserService: CreateUserService,
    private getUsersService: GetUsersService,
    private updateUserService: UpdateUserService,
  ) {}

  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateUserDto) {
    const result = await this.createUserService.execute(user.companyId, dto, user.id);
    return { success: true, data: result, message: 'Staff created successfully' };
  }

  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @Get()
  async getAll(@CurrentUser() user: RequestUser) {
    const result = await this.getUsersService.getAll(user.companyId);
    return { success: true, data: result };
  }

  @Get(':id')
  async getById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.getUsersService.getById(user.companyId, id);
    return { success: true, data: result };
  }

  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const result = await this.updateUserService.execute(user.companyId, id, dto, user.id);
    return { success: true, data: result, message: 'User updated successfully' };
  }
}
