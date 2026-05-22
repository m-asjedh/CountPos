import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { CreateUserService } from '../../services/users/create-user.service';
import { GetUsersService } from '../../services/users/get-users.service';
import { UpdateUserService } from '../../services/users/update-user.service';

@Module({
  controllers: [UsersController],
  providers: [CreateUserService, GetUsersService, UpdateUserService],
})
export class UsersModule {}
