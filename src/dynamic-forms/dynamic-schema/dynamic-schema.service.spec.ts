import { Test, TestingModule } from '@nestjs/testing';
import { DynamicSchemaService } from './dynamic-schema.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { z } from 'zod';

const mockFormDefinition = {
  id: 'form-def-1',
  tenantId: 'tenant-1',
  formCode: 'general',
  version: 1,
  schemaDefinition: {
    steps: [
      {
        title: 'Anamnesis',
        fields: [
          {
            name: 'reason',
            label: 'Reason for Consultation',
            type: 'textarea',
            validations: { required: true, minLength: 10 },
          },
          {
            name: 'age',
            label: 'Patient Age',
            type: 'number',
            validations: { required: true, min: 0, max: 120 },
          },
          {
            name: 'notes',
            label: 'Additional Notes',
            type: 'text',
          },
        ],
      },
    ],
  },
};

describe('DynamicSchemaService', () => {
  let service: DynamicSchemaService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicSchemaService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DynamicSchemaService>(DynamicSchemaService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should build a validator that accepts valid data', async () => {
    const validator = await service.getValidatorForForm(mockFormDefinition);
    const validData = {
      reason: 'Persistent headache for 3 days.',
      age: 35,
      notes: 'The patient reports no other symptoms.',
    };

    expect(() => validator.parse(validData)).not.toThrow();
  });

  it('should build a validator that rejects invalid data', async () => {
    const validator = await service.getValidatorForForm(mockFormDefinition);
    const invalidData = {
      reason: 'Pain',
      age: 200,
    };

    expect(() => validator.parse(invalidData)).toThrow();
  });

  it('should reject data with unexpected fields (strict mode)', async () => {
    const validator = await service.getValidatorForForm(mockFormDefinition);
    const dataWithExtraFields = {
      reason: 'Persistent headache for 3 days.',
      age: 35,
      notes: 'The patient reports no other symptoms.',
      unexpectedField: 'This should not be allowed',
    };

    expect(() => validator.parse(dataWithExtraFields)).toThrow();
  });

  it('should use cache on second call', async () => {
    await service.getValidatorForForm(mockFormDefinition);
    expect(cacheManager.get).toHaveBeenCalledTimes(1);
    expect(cacheManager.set).toHaveBeenCalledTimes(1);

    (cacheManager.get as jest.Mock).mockResolvedValueOnce(z.strictObject({}));

    await service.getValidatorForForm(mockFormDefinition);
    expect(cacheManager.get).toHaveBeenCalledTimes(2);
    expect(cacheManager.set).toHaveBeenCalledTimes(1);
  });
});
