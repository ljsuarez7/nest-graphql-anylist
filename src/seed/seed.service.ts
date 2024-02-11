import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { SEED_ITEMS, SEED_LISTS, SEED_USERS } from './data/seed-data';
import { UsersService } from 'src/users/users.service';
import { ItemsService } from 'src/items/items.service';
import { ListItem } from 'src/list-item/entities/list-item.entity';
import { List } from 'src/lists/entities/list.entity';
import { ListsService } from 'src/lists/lists.service';
import { ListItemService } from 'src/list-item/list-item.service';

@Injectable()
export class SeedService {

    private isProd: boolean;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(Item)
        private readonly itemsRepository: Repository<Item>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(ListItem)
        private readonly listItemsRepository: Repository<ListItem>,
        @InjectRepository(List)
        private readonly listsRepository: Repository<List>,
        private readonly usersService: UsersService,
        private readonly itemsService: ItemsService,
        private readonly listsService: ListsService,
        private readonly listItemsService: ListItemService,
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

        //Crear lists
        const list = await this.loadLists(user);

        //Crear listItems
        const items = await this.itemsService.findAll(user, {limit: 15, offset: 0}, {});
        await this.loadListItems(list, items);

        return true;

    }

    async deleteDataBase(){

        //Borrar listItems
        await this.listItemsRepository.createQueryBuilder()
            .delete()
            .where({})
            .execute();

        //Borrar lists
        await this.listsRepository.createQueryBuilder()
            .delete()
            .where({})
            .execute();

        //Borrar items
        await this.itemsRepository.createQueryBuilder()
            .delete()
            .where({})
            .execute();

        //Borrar usuarios
        await this.usersRepository.createQueryBuilder()
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

    async loadLists(user: User): Promise<List>{

        const lists = [];

        for(const list of SEED_LISTS){
            lists.push(await this.listsService.create(list, user));
        }

        return lists[0];

    }

    async loadListItems(list: List, items: Item[]): Promise<void>{

        //SE PODRIA MIRAR DE HACER QUE LOS DISTINTOS ITEM SE AÑADIERA A DISTINTAS LISTAS DE MANERA RANDOM

        for (const item of items) {
            
            this.listItemsService.create({
                quantity: Math.round(Math.random()*10),
                completed: Math.round(Math.random()*1) === 0 ? false : true,
                listId: list.id,
                itemId: item.id
            })

        }

    }

    //Mirar como insertar en el seed de manera que los usuarios sean random o que se repartan los items

}
