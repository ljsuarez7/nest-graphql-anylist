import * as bcrypt from 'bcrypt';

import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { SignupInput } from '../auth/dto/inputs/signup.input';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';

@Injectable()
export class UsersService {

  private logger: Logger = new Logger('UsersService');

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ){}

  async create(signupInput: SignupInput): Promise<User> {
    try {
      const newUser = this.usersRepository.create({
        ...signupInput,
        password: bcrypt.hashSync(signupInput.password, 10)
      });
      return await this.usersRepository.save(newUser);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }
  
  async findAll(roles: ValidRoles[]): Promise<User[]> {

    if(roles.length === 0) return this.usersRepository.find();
    
    // No hace falta esto porque tenemos puesto lazy en la columna lastUpdateBy en el entity
    // if(roles.length === 0){
    //   return this.usersRepository.find({
    //     relations: {lastUpdateBy: true}
    //   });
    // }

    return this.usersRepository.createQueryBuilder() //Se está mirando si alguno de los valores del array de roles que pasamos está en la columna de roles del usuario en BD
    .andWhere('ARRAY[roles]&&ARRAY[:...roles]') //ARRAY[roles] (esta es la columna roles) && ARRAY[:...roles] (esto es un parametro para comparar)
    .setParameter('roles', roles)
    .getMany();

  }
  
  async findOneByEmail(email: string): Promise<User> {
    try {
      return await this.usersRepository.findOneByOrFail({email});
    } catch (error) {
      throw new NotFoundException(`${email} not found`);
      // this.handleDBErrors({
      //   code: 'error-001',
      //   detail: `${email} not found`
      // });
    }
  }

  async findOneById(id: string): Promise<User> {
    try {
      return await this.usersRepository.findOneByOrFail({id});
    } catch (error) {
      throw new NotFoundException(`${id} not found`);
    }
  }

  async update(
    id: string, 
    updateUserInput: UpdateUserInput,
    updateBy: User
  ): Promise<User> {
    try {
      const user = await this.usersRepository.preload({
        ...updateUserInput,
        id
      });
      user.lastUpdateBy = updateBy;
      return await this.usersRepository.save(user);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async block(id: string, adminUser: User): Promise<User> {
    const userToBlock = await this.findOneById(id);
    userToBlock.isActive = false;
    userToBlock.lastUpdateBy = adminUser;
    return await this.usersRepository.save(userToBlock);
  }

  private handleDBErrors(error: any): never{

    this.logger.error(error);

    if(error.code === '23505'){
      throw new BadRequestException(error.detail.replace('Key', ''));
    }

    if(error.code === 'error-001'){
      throw new BadRequestException(error.detail.replace('Key', ''));
    }

    throw new InternalServerErrorException('Please check server logs');
  }
  
}
