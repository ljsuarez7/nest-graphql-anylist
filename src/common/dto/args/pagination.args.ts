import { ArgsType, Field, Int } from "@nestjs/graphql";
import { IsOptional, Min } from "class-validator";

@ArgsType()
export class PaginationArgs{

    @Field(() => Int, {nullable: true})
    @IsOptional()
    @Min(0)
    offset: number = 0; //Por defecto empieza en 0

    @Field(() => Int, {nullable: true})
    @IsOptional()
    @Min(1)
    limit: number = 10; //Por defecto se trae los 10 primeros

    //MIRAR UNA FORMA DE HACER QUE SE PUEDA TRAER TODO EN LOS LISTADOS

}

