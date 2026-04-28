import { ChorusSchemas, ChorusRepository, SchemaFromRepository } from "./types";

export type { SchemaFromRepository } from './types'

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type NonPrimitiveKeys<T> = {
  [K in keyof T]: T[K] extends Primitive ? never : K
}[keyof T];

export type EntityRepository<
    EntityModel extends Record<UniqueFields | GeneratedFields | ImmutableFields, unknown>,
    DetailsFields extends keyof EntityModel = NonPrimitiveKeys<EntityModel>,
    UniqueFields extends string = 'id',
    GeneratedFields extends string = 'id' | string & NonPrimitiveKeys<EntityModel>,
    ImmutableFields extends string = UniqueFields | string & NonPrimitiveKeys<EntityModel>
> = ChorusRepository<
    ChorusSchemas<
        Omit<EntityModel, DetailsFields>,
        EntityModel,
        Partial<Omit<EntityModel, UniqueFields>>,
        Pick<EntityModel, UniqueFields>,
        Omit<EntityModel, GeneratedFields>,
        Partial<Omit<EntityModel, ImmutableFields>>
    >
>

export type ValueObjectRepository<
    ValueObjectModel
> = ChorusRepository<
    ChorusSchemas<
        ValueObjectModel,
        ValueObjectModel,
        Partial<ValueObjectModel>,
        ValueObjectModel,
        ValueObjectModel,
        Partial<ValueObjectModel>
    >
>

export type CustomRepository<    
    ListModel,
    DetailsModel,
    ListFilter,
    SpecificFilter,
    CreationPayload,
    UpdatePayload
> = ChorusRepository<
    ChorusSchemas<
        ListModel,
        DetailsModel,
        ListFilter,
        SpecificFilter,
        CreationPayload,
        UpdatePayload
    >
>

export class InMemoryRepository<T extends ChorusRepository<any>> {
    protected data: Array<SchemaFromRepository<T>['models']['details']>

    constructor(
        private readonly config?: {
            searchLogic?: {
                list?: (
                    entity: SchemaFromRepository<T>['models']['list'],
                    filter: SchemaFromRepository<T>['filters']['list']
                ) => boolean;
                specific?: (
                    entity: SchemaFromRepository<T>['models']['details'],
                    filter: SchemaFromRepository<T>['filters']['specific']
                ) => boolean;
            };
            mappers?: {
                detailToList?: (
                    details: SchemaFromRepository<T>['models']['details']
                ) => SchemaFromRepository<T>['models']['list'];
            };
            actionsLogic?: {
                create?: (
                    payload: SchemaFromRepository<T>['actionsPayload']['creation']
                ) => SchemaFromRepository<T>['models']['details'];
                update?: (
                    prevValue: SchemaFromRepository<T>['models']['details'],
                    update: SchemaFromRepository<T>['actionsPayload']['update']
                ) => SchemaFromRepository<T>['models']['details'];

            }
            initialData?: Array<SchemaFromRepository<T>['models']['details']>;
        }
    ) {
        this.data = this.config?.initialData ?? [] 
    }


    private defaultListSearchLogic = (
        entity: SchemaFromRepository<T>['models']['details'],
        filter: SchemaFromRepository<T>['filters']['list']
    ) => {
        const patternKeys = Object.entries(filter as object)
            .filter(([_, value]) => !!value)
            .map((x) => x[0]);
        const entityAsObject = entity as object;

        return Object.entries(entityAsObject)
            .filter(([key]) => patternKeys.includes(key))
            .every(([key, value]) => {
                return (
                    value === (filter as Record<string, any>)[key] ||
                    value
                        ?.toString()
                        ?.includes(
                            (filter as Record<string, any>)[
                                key
                            ]?.toString()
                        )
                );
            });
    };

    private defaultSpecificSearchLogic = (
        entity: SchemaFromRepository<T>['models']['details'],
        filter: SchemaFromRepository<T>['filters']['specific']
    ) => {
        const patternKeys = Object.entries(filter as object)
            .filter(([_, value]) => !!value)
            .map((x) => x[0]);
        const entityAsObject = entity as object;

        return Object.entries(entityAsObject)
            .filter(([key]) => patternKeys.includes(key))
            .every(([key, value]) => {
                return (
                    value === (filter as Record<string, any>)[key] ||
                    value
                        ?.toString()
                        ?.includes(
                            (filter as Record<string, any>)[
                                key
                            ]?.toString()
                        )
                );
            });
    };

    list: T['list'] = async (filter,  pagination) => {
        const afterFiltration = this.data.filter((x) =>
            (this.config?.searchLogic?.list ?? this.defaultListSearchLogic)(x, filter)
        );
        const afterPagination = pagination ? afterFiltration.filter((_, i) => {
            return (
                i >= pagination.pageSize * pagination.zeroBasedPageIndex &&
                i <
                    (pagination.zeroBasedPageIndex + 1) *
                        pagination.pageSize
            );
        }) : afterFiltration;
        
        return afterPagination as SchemaFromRepository<T>['models']['list'][]
    }

    details: T['details'] = async (filter) => {
        const result = this.data.find(x => (this.config?.searchLogic?.specific ?? this.defaultSpecificSearchLogic)(x, filter))
        if (!result) {
            return null
        }
        return result
    }
    
    create: T['create'] = async (payload) => {
        const newItem = this.config?.actionsLogic?.create ? this.config?.actionsLogic?.create(payload) : {  ...payload, id: Math.random().toString() }
        this.data.push(newItem)
        return newItem
    }

    updateOne: T['updateOne'] = async (filter, payload) => {
        const index = this.data.findIndex(x => (this.config?.searchLogic?.specific ?? this.defaultSpecificSearchLogic)(x, filter));

        this.data = this.data.map((x, i) => {
            if (i !== index) {
                return x;
            }

            return this.config?.actionsLogic?.update ? this.config.actionsLogic.update(x, payload) : { ...x, ...payload };
        });

        return { existed: index > -1 };
    }

    deleteOne: T['deleteOne'] = async (filter) => {
        const index = this.data.findIndex(x => (this.config?.searchLogic?.specific ?? this.defaultSpecificSearchLogic)(x, filter));

        this.data = this.data.filter((x, i) => i !== index)

        return { existed: index > -1 }
    }
}
