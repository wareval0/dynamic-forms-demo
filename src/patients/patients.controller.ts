import { Controller, Get, Post, Body, UsePipes } from '@nestjs/common';
import { PatientsService } from './patients.service';
import {
  type CreatePatientDto,
  createPatientSchema,
} from './dto/create-patient.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createPatientSchema))
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }
}
