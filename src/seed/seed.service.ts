import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { SEED_ITEMS, SEED_USERS } from './data/seed-data';
import { UsersService } from 'src/users/users.service';
import { ItemsService } from 'src/items/items.service';

@Injectable()
export class SeedService {

    private isProd: boolean;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(Item)
        private readonly itemsRespository: Repository<Item>,
        @InjectRepository(User)
        private readonly usersRespository: Repository<User>,
        private readonly usersService: UsersService,
        private readonly itemsService: ItemsService,
    ){
        this.isProd = configService.get('STATE') === 'prod'; //Esto viene de una variable de entorno
    }

    async executeSeed(){

        //Proteger para que solo se pueda ejecutar si no es produccion
        if(this.isProd){ //Si tuviera la creacion de usuarios fuera de este graphql se podria proteger esto para que solo lo puedan ejecutar administradores
            throw new UnauthorizedException('We cannot run Seed on Prod');
        }
        //Borrar la bbdd
        await this.deleteDataBase();

        //Crear usuarios
        const user = await this.loadUsers();

        //Crear items
        await this.loadItems(user);

        return true;

    }

    async deleteDataBase(){

        //Borrar items
        await this.itemsRespository.createQueryBuilder()
            .delete()
            .where({})
            .execute();

        //Borrar usuarios
        await this.usersRespository.createQueryBuilder()
        .delete()
        .where({})
        .execute();

    }

    async loadUsers(): Promise<User>{

        const users = [];

        for(const user of SEED_USERS){
            users.push(await this.usersService.create(user));
        }

        return users[0];

    }

    async loadItems(user: User): Promise<void>{

        const itemsPromises = [];

        for(const item of SEED_ITEMS){
            itemsPromises.push(this.itemsService.create(item, user));
        }

        await Promise.all(itemsPromises);

    }

    //Mirar como insertar en el seed de manera que los usuarios sean random o que se repartan los items

}
