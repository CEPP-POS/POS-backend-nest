import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Equal, Raw, Repository } from 'typeorm';
import { Owner } from '../../entities/owner.entity';
import { CreateOwnerDto } from './dto/create-owner/create-owner.dto';
import * as bcrypt from 'bcrypt';
import { sendTemporaryPasswordEmail } from '../../utils/send-email.util';
import { UpdatePasswordDto } from './dto/update-password/update-password.dto';
import { LoginOwnerDto } from './dto/login-owner/login-owner.dto';
import { ForgotPasswordDto } from './dto/forgot-owner/forgot-owner.dto';
import { VerifyOtpDto } from './dto/verify-otp-owner/verify-otp-owner.dto';
import { Ingredient } from 'src/entities/ingredient.entity';
import { CreateEmployeeDto } from './dto/create-employee/create-employee.dto';

@Injectable()
export class OwnerService {
  constructor(
    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,

    @InjectRepository(Ingredient)
    private ingredientRepository: Repository<Ingredient>,
  ) {}

  // * Register Owner (Owner Only)
  async create(createOwnerDto: CreateOwnerDto): Promise<Owner> {
    const existingOwner = await this.findByEmail(createOwnerDto.email);
    if (existingOwner) {
      throw new BadRequestException('Email already exists');
    }

    const tempPassword = Math.random().toString(36).slice(-8); // ? Generate a random temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newOwner = this.ownerRepository.create({
      ...createOwnerDto,
      password: hashedPassword, // ? Save the hashed password
      roles: ['owner'],
    });

    const savedOwner = await this.ownerRepository.save(newOwner);
    try {
      await sendTemporaryPasswordEmail(savedOwner.email, tempPassword);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new BadRequestException(
        'Failed to send email. Please try again later.',
      );
    }
    return savedOwner;
  }
  // * Create Employee
  async createEmployee(createEmployeeDto: CreateEmployeeDto): Promise<Owner> {
    const { email, password, manager_id } = createEmployeeDto;

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const manager = await this.ownerRepository.findOne({
      where: { owner_id: manager_id },
    });

    if (!manager) {
      throw new BadRequestException('Manager (Owner) not found.');
    }

    const newEmployee = this.ownerRepository.create({
      email,
      password: hashedPassword,
      roles: ['employee'],
      manager,
    });

    return this.ownerRepository.save(newEmployee);
  }

  // * Find Owner or Employee by email
  async findByEmail(email: string): Promise<Owner | undefined> {
    return this.ownerRepository.findOne({
      where: { email },
      relations: ['manager'],
      select: [
        'owner_id',
        'owner_name',
        'contact_info',
        'email',
        'password',
        'branch',
        'roles',
      ],
    });
  }

  // * Login Owner or Employee
  async login(loginOwnerDto: LoginOwnerDto): Promise<Owner> {
    const user = await this.findByEmail(loginOwnerDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(
      loginOwnerDto.password,
      user.password,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  // * Forgot Password (Generate OTP)
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { usernameOrEmail } = forgotPasswordDto;

    const user = await this.ownerRepository.findOne({
      where: { email: usernameOrEmail },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otp_expiry = new Date();
    user.otp_expiry.setMinutes(user.otp_expiry.getMinutes() + 15);

    await this.ownerRepository.save(user);
    await this.sendOtpEmail(user.email, otp);
  }

  async sendOtpEmail(email: string, otp: string) {
    console.log(`OTP Sent: ${otp} to ${email}`);
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<void> {
    const { usernameOrEmail, otp } = verifyOtpDto;

    const user = await this.ownerRepository.findOne({
      where: { email: usernameOrEmail },
    });

    if (!user || user.otp !== otp || user.otp_expiry < new Date()) {
      throw new BadRequestException('OTP expired or invalid');
    }

    user.otp = null;
    user.otp_expiry = null;

    await this.ownerRepository.save(user);
  }

  async updatePassword(
    ownerId: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<Owner> {
    const user = await this.ownerRepository.findOne({
      where: { owner_id: ownerId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    user.password = hashedPassword;

    return this.ownerRepository.save(user);
  }

  // * Count Employees under a Manager
  async countEmployees(manager_id: number): Promise<number> {
    const manager = await this.ownerRepository.findOne({
      where: { owner_id: manager_id },
    });

    if (!manager) {
      throw new BadRequestException('Manager (Owner) not found.');
    }

    return this.ownerRepository.count({
      where: {
        manager,
        roles: Raw((alias) => `:role = ANY(${alias})`, { role: 'employee' }),
      },
    });
  }

  async getIngredientsByOwner(branchId: number) {
    return this.ingredientRepository.find({
      where: { branch: Equal(branchId) },
      select: ['ingredient_id', 'ingredient_name'],
    });
  }
}
