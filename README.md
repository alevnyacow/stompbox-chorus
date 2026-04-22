# Chorus

Framework-agnostic plug-and-play repositories with in-memory implementations.

## Example

```ts
import { EntityChorus, ChorusInMemory } from '@stompbox/chorus'

type User = { id: string, name: string }

type UserRepository = EntityChorus<User>

class UserInMemoryRepository extends ChorusInMemory<
    UserRepository
> {
    constructor() {
        // can be configured via optional config in constructor
        super()
    }
}

class UserPrismaRepository implements UserRepository {
    // ... implementation
}

const usersInMemory = new UserInMemoryRepository()

const newUser = await usersInMemory.create(
    // creation payload
    { name: 'driver 8' }
)
const driver8 = await usersInMemory.details(
    // specific search filter
    { id: newUser.id }
)
const users = await usersInMemory.list(
    // list seach filter
    { name: 'driver' }, 
    // optional pagination
    { zeroBasedPageIndex: 0, pageSize: 10 }
)
await usersInMemory.updateOne(
    // filter
    { id: newUser.id },
    // payload
    { name: 'take a break' }
)
await usersInMemory.deleteOne(
    // filter
    { id: newUser.id }
)
```