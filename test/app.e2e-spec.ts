import {INestApplication, ValidationPipe, } from '@nestjs/common';
import {Test} from '@nestjs/testing';

import {AppModule} from '../src/app.module';
import {PrismaService} from '../src/prisma/prisma.service';

describe('App e2e', () => {
  let app:INestApplication;
  let prisma: PrismaService;
  // Make replica of the main app run by the dev server
  // but solely for testing
  
  // Startup :: will be called when test is completed to remove
  // resource used by the test 
  beforeAll(async() => {


    // Load the application module
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // create a nest application with the loaded modules
    app = moduleRef.createNestApplication(); 

    // utilize globals
    app.useGlobalPipes(new ValidationPipe({whitelist: true}));

    // initialize the app
    await app.init()
    
    prisma = app.get(PrismaService);

    await prisma.cleanDb();
  });

  // Breakdown :: will be called when test is completed to remove
  // resource used by the test 
  afterAll(async() => {
    app.close();
  })

  it.todo('should pass');
})