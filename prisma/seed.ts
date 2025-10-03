import { Prisma, PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const formSchemaForLoadTest: Prisma.JsonObject = {
  steps: [
    {
      title: 'Datos Principales V3',
      fields: [
        {
          name: 'anamnesis',
          label: 'Anamnesis del Paciente',
          type: 'textarea',
          validations: { required: true, minLength: 20 },
        },
        {
          name: 'systolicPressure',
          label: 'Presión Sistólica',
          type: 'number',
          validations: { required: true, min: 50, max: 300 },
        },
        {
          name: 'diagnosisCode',
          label: 'Código de Diagnóstico (ICD-10)',
          type: 'text',
          validations: { required: true, minLength: 3, maxLength: 10 },
        },
        {
          name: 'observations',
          label: 'Observaciones Adicionales',
          type: 'text',
        },
      ],
    },
  ],
};

async function main() {
  console.log('--- Starting seed script for load testing ---');

  console.log('Cleaning existing data...');
  await prisma.medicalConsultation.deleteMany();
  await prisma.formDefinition.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.tenant.deleteMany();
  console.log('Database cleaned.');

  console.log('Creating base entities (Tenant, Patient, FormDefinition)...');
  const tenant = await prisma.tenant.create({
    data: { name: 'Performance Test Clinic' },
  });

  const patient = await prisma.patient.create({
    data: {
      firstName: 'Load',
      lastName: 'TestUser',
      documentId: '99999999X',
      tenantId: tenant.id,
    },
  });

  const formDef = await prisma.formDefinition.create({
    data: {
      formCode: 'medicina-general',
      version: 1,
      isActive: true,
      schemaDefinition: formSchemaForLoadTest,
      tenantId: tenant.id,
    },
  });
  console.log('Base entities created.');

  const totalConsultations = 10000;
  console.log(`Generating ${totalConsultations} consultation records...`);

  const consultationsToCreate: Prisma.MedicalConsultationCreateManyInput[] = [];
  const keywords = [
    'gripe',
    'migraña',
    'hipertensión',
    'fractura',
    'alergia',
    'diabetes',
  ];
  const diagnosisCodes = ['J11.1', 'G43.9', 'I10', 'S52.5', 'T78.4', 'E11.9'];

  for (let i = 0; i < totalConsultations; i++) {
    const randomKeyword = keywords[i % keywords.length];
    const randomCode = diagnosisCodes[i % diagnosisCodes.length];

    const consultationData = {
      patientId: patient.id,
      formDefinitionId: formDef.id,
      formData: {
        anamnesis: `El paciente #${i + 1} presenta un cuadro clínico consistente con ${randomKeyword}.`,
        systolicPressure: 110 + (i % 45),
        diagnosisCode: randomCode,
        observations: `Observación de rutina para el registro ${i + 1}.`,
      },
    };
    consultationsToCreate.push(consultationData);
  }

  await prisma.medicalConsultation.createMany({
    data: consultationsToCreate,
  });

  console.log(
    `${totalConsultations} consultation records created successfully.`,
  );

  console.log(
    '--- Seeding finished. The database is ready for load testing. ---',
  );
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
