import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ItemsModule } from './items/items.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot(),

    GraphQLModule.forRootAsync({
      driver: ApolloDriver,
      imports: [AuthModule],
      inject: [JwtService],
      useFactory: async(jwtService: JwtService) => ({
        playground: false,
        autoSchemaFile: join( process.cwd(), 'src/schema.gql'),
        plugins: [
          ApolloServerPluginLandingPageLocalDefault()
        ],
        context({req}){

          //Esto es para proteger el esquema, pero no se puede dejar ya que sino no se puede hacer login
          //Para esto habria que poner el login y el de registro en otro servicio o en otra url de graphql
          //Asi se podria proteger el resto

          // const token = req.headers.authorization?.replace('Bearer ', '');
          // if(!token) throw new Error('Token needed');
          // const payload = jwtService.decode(token);
          // if(!payload) throw new Error('Token not valid');
        }
      })
    }),

    // CONFIGURACION BASICA
    // GraphQLModule.forRoot<ApolloDriverConfig>({
    //   driver: ApolloDriver,
    //   autoSchemaFile: join( process.cwd(), 'src/schema.gql'),
    //   playground: false,
    //   plugins: [
    //     ApolloServerPluginLandingPageLocalDefault()
    //   ]
    // }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: true,
      autoLoadEntities: true
    }),
    ItemsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
