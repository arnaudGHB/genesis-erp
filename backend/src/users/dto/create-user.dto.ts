import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string; // <-- Ajouter le "!"

  @IsEmail()
  @IsNotEmpty()
  email!: string; // <-- Ajouter le "!"

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string; // <-- Ajouter le "!"
}