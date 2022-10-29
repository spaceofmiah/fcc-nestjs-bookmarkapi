import {INestApplication, ValidationPipe, } from '@nestjs/common';
import {Test} from '@nestjs/testing';
import * as pactum from 'pactum';

import {AppModule} from '../src/app.module';
import {EditUserDto} from '../src/user/dto';
import { EditBookmarkDto, CreateBookmarkDto} from '../src/bookmark/dto';
import {PrismaService} from '../src/prisma/prisma.service';

describe('App e2e', () => {
  let app:INestApplication;
  let prisma: PrismaService;
  const SERVER_PORT: number = 3333
  const BASE_URL: string = `http://localhost:${SERVER_PORT}`
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
    await app.listen(SERVER_PORT);
    
    prisma = app.get(PrismaService);

    await prisma.cleanDb();

    pactum.request.setBaseUrl(BASE_URL)
  });

  // Breakdown :: will be called when test is completed to remove
  // resource used by the test 
  afterAll(async() => {
    app.close();
  });

  
  describe("Auth", () => {
    const authDto = {
      email: 'example@mail.com',
      password: 'password'
    }

    describe("signup", () => {
      it("should throw if email empty", () => {
        return pactum
        .spec()
        .post('/auth/signup')
        .withBody({password: authDto.password})
        .expectStatus(400)
      });

      it("should throw if password empty", () => {
        return pactum
        .spec()
        .post('/auth/signup')
        .withBody({email: authDto.email})
        .expectStatus(400)
      });

      it("should throw if no body", () => {
        return pactum
        .spec()
        .post('/auth/signup')
        .expectStatus(400)
      });

      it("should be successful", () => {
        return pactum
        .spec()
        .post('/auth/signup')
        .withBody(authDto)
        .expectStatus(201)
      });

      it("should fail when email is taken", () => {
        return pactum
        .spec()
        .post('/auth/signup')
        .withBody(authDto)
        .expectStatus(403)
      })

      it("should fail on invalid email", () => {
        return pactum
        .spec()
        .post('/auth/signup')
        .withBody({email: 'noat.com', password:authDto.password})
        .expectStatus(400)
      });
    });

    describe("signin", () => {
      it("should be successful", () => {
        return pactum
        .spec()
        .post('/auth/signin')
        .withBody(authDto)
        .expectStatus(200)
        .stores('userAccessToken', 'access_token')
      });

      it("should throw if email empty", () => {
        return pactum
        .spec()
        .post('/auth/signin')
        .withBody({password: authDto.password})
        .expectStatus(400)
      });

      it("should throw if password empty", () => {
        return pactum
        .spec()
        .post('/auth/signin')
        .withBody({email: authDto.email})
        .expectStatus(400)
      });

      it("should throw if no body", () => {
        return pactum
        .spec()
        .post('/auth/signin')
        .expectStatus(400)
      });
    });
  });

  describe("Users", () => {
    describe("get me", () => {
      it('should get current user', () => {
        return pactum
        .spec()
        .get('/users/me')
        .withHeaders({
          'Authorization': 'Bearer $S{userAccessToken}'
        })
        .expectStatus(200)
      });

      it('should throw when unauthenticated', () => {
        return pactum
        .spec()
        .get('/users/me')
        .expectStatus(401)
      });
    });

    describe("edit user", () => {
      const editUserDto: EditUserDto = {
        firstName: 'James',
        lastName: 'Doe'
      }

      it('should edit user', () => {
        return pactum
        .spec()
        .patch('/users')
        .withBody(editUserDto)
        .withHeaders({
          'Authorization': 'Bearer $S{userAccessToken}'
        })
        .expectStatus(200)
        .expectBodyContains(editUserDto.firstName)
        .expectBodyContains(editUserDto.lastName)
      });
    });
  });

  describe("Bookmark", () => {
    describe("get empty bookmarks", () => {
      it("should return empty bookmarks", () => {
        return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({
          'Authorization': 'Bearer $S{userAccessToken}'
        })
        .expectStatus(200)
        .expectBody([])
      })
    })

    describe("create bookmark", () => {
      const createBookmarkDto:CreateBookmarkDto = {
        title: 'First bookmark',
        'description': 'Hello to bookmark',
        'link': 'https://example.com'
      }

      it("should create new bookmark", () => {
        return pactum
        .spec()
        .post('/bookmarks')
        .withBody(createBookmarkDto)
        .withHeaders({
          'Authorization': 'Bearer $S{userAccessToken}'
        })
        .expectStatus(201)
        .stores('bookmarkId', 'id')
      })
    })

    describe("get bookmarks", () => {
      it("should get bookmarks", () => {
        return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({
          'Authorization': 'Bearer $S{userAccessToken}'
        })
        .expectStatus(200)
        .expectJsonLength(1)
      }) 
    })

    describe("get bookmark by id", () => {
      it("should get bookmark by id", () => {
        return pactum
        .spec()
        .get('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          'Authorization': 'Bearer $S{userAccessToken}'
        })
        .expectStatus(200)
        .expectBodyContains('$S{bookmarkId}')
      })
    })

    describe("edit bookmark", () => {
      const editBookmarkDto: EditBookmarkDto = {
        title: 'Updated title',
        description: 'Some super useful description',
        link: 'https://updatedlink.com/new-title-description'
      }
      it("should edit bookmark", () => {
        return pactum
        .spec()
        .patch('/bookmarks/{id}/')
        .withPathParams('id', '$S{bookmarkId}')
        .withBody(editBookmarkDto)
        .withHeaders({
          'Authorization': 'Bearer $S{userAccessToken}'
        })
        .expectStatus(200)
        .expectBodyContains(editBookmarkDto.title)
        .expectBodyContains(editBookmarkDto.link)
      })
    })

    describe("delete bookmark", () => {
      it("should delete bookmark", () => {
        return pactum
        .spec()
        .delete('/bookmarks/{id}/')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          'Authorization': 'Bearer $S{userAccessToken}'
        })
        .expectStatus(204)
      })

      it("should get empty bookmarks", () => {
        return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({
          'Authorization': 'Bearer $S{userAccessToken}'
        })
        .expectStatus(200)
        .expectJsonLength(0)
      })
    })
  });
})