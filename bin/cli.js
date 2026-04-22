#!/usr/bin/env node
import fs from "fs";
import path from "path";

var args = process.argv.slice(2);

var [command, entityName] = args;

function toCamelAndPascalFromUnknownSource(str) {
    if (!str.includes('-')) {
        return [str, str.substring(0, 1).toUpperCase() + str.substring(1)]
    }

    const words = str.split("-");

    const lowerCamel = words
        .map((word, index) => 
        index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("");

    const upperCamel = words
        .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
        .join("");

    return [lowerCamel, upperCamel];
}

function findProjectRoot(startDir = process.cwd()) {
    let dir = startDir;
    while (dir !== path.parse(dir).root) {
        if (fs.existsSync(path.join(dir, "package.json"))) {
            return dir;
        }
        dir = path.dirname(dir);
    }
    return null;
}

function loadConfig() {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return null;
    }

    const configPath = path.join(projectRoot, "stompbox.config.json");

    if (!fs.existsSync(configPath)) {
        return null;
    }

    const rawData = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(rawData);
    return config.chorus;
}


function createDefaultConfig() {
    const config = loadConfig();

    if (!config) {
        const projectRoot = findProjectRoot()
        if (!projectRoot) {
            throw 'No package.json was found'
        }

        fs.writeFileSync(path.resolve(projectRoot, 'stompbox.config.json'), JSON.stringify({
            chorus: {
                paths: {
                    "implementation": "@/infrastructure/${source}/repositories",
                    "contract": "@/application/repositories"
                },
                namings: {
                    "implementationFile": "${entity}.repository.${source}.ts",
                    "contractFile": "${entity}.repository.ts"
                },
                prisma: {
                    "contractsPath": "@/generated/prisma",
                    "clientPath": "@/infrastructure/prisma/client.ts",
                    "clientName": "prismaClient"
                }
            }
        }, null, '\t'))
    }
}

if (command === 'init') {
    console.log('📚 Creating "stompbox.config.json" file...')
    createDefaultConfig()
    process.exit(0)
}

if (command === 'scaffold' || command === 's') {
    const config = loadConfig()
    if (!config) {
        console.error('No config was found. Initialize chorus with "npx chorus init" command.')
        process.exit(1)
    }
    if (!entityName) {
        console.error('No entity name was provided!')
        process.exit(1)
    }

    const [camel, pascal] = toCamelAndPascalFromUnknownSource(entityName)
    const { paths, prisma, namings } = config
    const { implementation, contract } = paths
    const { contractsPath, clientPath, clientName } = prisma
    const { implementationFile, contractFile } = namings

    const root = findProjectRoot()
    const sources = ['in-memory', 'prisma']

    for (const source of sources) {
        const rootFolder = path.join(root, implementation.substring(2)).replaceAll('${source}', source)
        fs.mkdirSync(rootFolder, { recursive: true })

        const fileName = path.join(
            rootFolder, 
            implementationFile
        ).replaceAll('${source}', source).replaceAll('${entity}', entityName)

        if (source === 'in-memory') {
            console.log(`📚 Scaffolding in-memory repository implementation for ${pascal} entity...`)
            fs.writeFileSync(fileName, 
            `
import { ChorusInMemory } from '@stompbox/chorus'
import { ${pascal}Repository } from '${contract}/${contractFile.replaceAll('${entity}', entityName).slice(0, -3)}'

/**
 * ${pascal} entity in-memory repository implementation.
 */ 
export class ${pascal}InMemoryRepository 
    extends ChorusInMemory<${pascal}Repository>
    implements ${pascal}Repository {
    
}\n`)
        }

        if (source === 'prisma') {
            console.log(`📚 Scaffolding Prisma repository implementation for ${pascal} entity...`)
            fs.writeFileSync(fileName, 
            `
import { SchemaFromRepository } from '@stompbox/chorus'
import { Prisma } from '${contractsPath}'
import { ${clientName} } from '${clientPath}'
import { ${pascal}Repository } from '${contract}/${contractFile.replaceAll('${entity}', entityName).slice(0, -3)}'

type Schema = SchemaFromRepository<${pascal}Repository>

/**
 * Filter mappers
 */ 

const toFindUniquePayload = (source: Schema['filters']['specific']): Prisma.${pascal}WhereUniqueInput => {
    return {

    }
}

const toFindManyPayload = (source: Schema['filters']['list']): Prisma.${pascal}WhereInput => {
    return {
    
    }
}

/**
 * Model mappers
 */ 

const toListModel = (source: Prisma.${pascal}GetPayload<{}>): Schema['models']['list'] => {
    return {
    
    }    
}

const toDetails = (source: Prisma.${pascal}GetPayload<{}>): Schema['models']['details'] => {
    return {
    
    }
}

/**
 * Action payload mappers.
 */ 

const toCreatePayload = (source: Schema['actionsPayload']['creation']): Prisma.${pascal}CreateInput => {
    return {
    
    }
}

const toUpdatePayload = (source: Schema['actionsPayload']['update']): Prisma.${pascal}UpdateInput => {
    return {
    
    }
}

/**
 * ${pascal} entity Prisma repository implementation.
 */ 
export class ${pascal}PrismaRepository implements ${pascal}Repository {
    list: ${pascal}Repository['list'] = async (filter, pagination) => {
        const list = await ${clientName}.${camel}.findMany({
            where: toFindManyPayload(filter),
            skip: pagination ? (pagination.zeroBasedPageIndex * pagination.pageSize) : undefined,
            take: pagination ? pagination.pageSize : undefined
        })

        return list.map(toListModel)
    }

    details: ${pascal}Repository['details'] = async (filter) => {
        const details = await ${clientName}.${pascal}.findUnique({
            where: toFindUniquePayload(filter)
        })

        if (!details) {
            return null
        }

        return toDetails(details)
    }

    create: ${pascal}Repository['create'] = async (payload) => {
        const createdEntity = await ${clientName}.${pascal}.create({
            data: toCreatePayload(payload)
        })

        return createdEntity
    }

    updateOne: ${pascal}Repository['updateOne'] = async (filter, payload) => {
        const result = await ${clientName}.${pascal}.update({
            where: toFindManyPayload(filter),
            data: toUpdatePayload(payload)
        });

        return { existed: !!result }
    }

    deleteOne: ${pascal}Repository['deleteOne'] = async (filter) => {
        const result = await ${clientName}.${pascal}.delete({
            where: toFindUniquePayload(filter)
        })

        return { existed: !!result }
    }
}\n`)

        }
    }

    
}