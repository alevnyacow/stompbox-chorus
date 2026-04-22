import { beforeEach, expect, test } from '@rstest/core';
import { ChorusInMemory, EntityChorus } from '../src/index';

type FunnyEntity = {
  id: number,
  stringField: string,
  booleanField: boolean,
  additionalField: number,
  broId: string,
  bro: {
    name: string,
    favouriteTea: string
  }
}

type FunnyEntityRepository = EntityChorus<FunnyEntity, 'additionalField' | 'bro'>

class FunnyEntityInMemoryRepository extends ChorusInMemory<FunnyEntityRepository> {
  constructor() {
    super({
      actionsLogic: {
        create: (payload) => {
          return {
            ...payload,
            bro: {
              favouriteTea: 'pu-erh',
              name: 'sup'
            },
            id: Math.random()
          }
        }
      },
      mappers: {
        detailToList: (x) => {
          return {
            booleanField: x.booleanField,
            broId: x.broId,
            id: x.id,
            stringField: x.stringField        
          }
        }
      }
    })
  }
}

let instance = new FunnyEntityInMemoryRepository()

beforeEach(() => {
  instance = new FunnyEntityInMemoryRepository()
})

test('empty by default', async () => {
    const items = await instance.list({ });
    expect(items.length).toBe(0);
});

test('can find added item by id', async () => {
    const { id } = await instance.create({
        additionalField: 22,
        booleanField: true,
        stringField: 'string',
        broId: 'some-funny-bro'
    });

    const data = await instance.details({ id });
    expect(data).toBeTruthy();
    expect(data!.booleanField).toBe(true);
    expect(data!.stringField).toBe('string');
    expect(data!.additionalField).toBe(22);
    expect(data!.id).toBe(id);
});

test('search by substring', async () => {
    const { id } = await instance.create({
        additionalField: 124,
        booleanField: true,
        stringField: 'test',
        broId: 'some-funny-bro'
    });
    const [data] = await instance.list({ stringField: 'te' });
    expect(data).toBeTruthy();
    expect(data!.stringField).toBe('test');
});
