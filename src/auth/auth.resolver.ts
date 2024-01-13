import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { SignupInput, LoginInput } from './dto/inputs';
import { AuthResponse } from './types/auth-response.type';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';

@Resolver( () => AuthResponse )
export class AuthResolver {

  constructor(
    private readonly authService: AuthService
  ) {}

  //Mirar de poner el sigup y login en un restful api aparte o ver si 
  //puedo crear rutas especificas de graphql para ellos, para asi poder proteger el resto de queries

  @Mutation(() => AuthResponse, {name: 'signup'})
  async signup(
    @Args('signupInput') signupInput: SignupInput
  ): Promise<AuthResponse>{
    return this.authService.signup(signupInput);
  }

  @Mutation(() => AuthResponse, {name: 'login'})
  async login(
    @Args('loginInput') loginInput: LoginInput
  ): Promise<AuthResponse>{
    return this.authService.login(loginInput);
  }

  @Query(() => AuthResponse, {name: 'revalidate'})
  @UseGuards(JwtAuthGuard)
  revalidateToken(
    @CurrentUser(/** [ValidRoles.admin] */) user: User
  ): AuthResponse {
    return this.authService.revalidateToken(user);
  }

}
