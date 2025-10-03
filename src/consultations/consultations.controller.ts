import {
  Controller,
  Post,
  Body,
  UsePipes,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import {
  createConsultationSchema,
  type CreateConsultationDto,
} from './dto/create-consultation.dto';
import {
  searchByFieldSchema,
  type SearchByFieldDto,
  searchByKeywordSchema,
  type SearchByKeywordDto,
} from './dto/search-consultation.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  type UpdateConsultationDto,
  updateConsultationSchema,
} from './dto/update-consultation.dto';

@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createConsultationSchema))
  create(@Body() createConsultationDto: CreateConsultationDto) {
    return this.consultationsService.create(
      createConsultationDto.tenantId,
      createConsultationDto,
    );
  }

  @Get()
  findAll() {
    return this.consultationsService.findAll();
  }

  @Get('/search-by-field')
  @UsePipes(new ZodValidationPipe(searchByFieldSchema))
  findByFormDataField(@Query() query: SearchByFieldDto) {
    return this.consultationsService.findByFormDataField(query);
  }

  @Get('/search-by-keyword')
  @UsePipes(new ZodValidationPipe(searchByKeywordSchema))
  searchByAnamnesisKeyword(@Query() query: SearchByKeywordDto) {
    return this.consultationsService.searchByAnamnesisKeyword(query);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateConsultationSchema))
    updateConsultationDto: UpdateConsultationDto,
  ) {
    console.log('Update DTO:', updateConsultationDto);
    return this.consultationsService.update(id, updateConsultationDto);
  }
}
