# Chorus

Framework-agnostic repositories with in-memory implementations.

## Example

```ts
import { EntityRepository, InMemoryRepository } from '@stompbox/chorus'

type User = { id: string, name: string }

type UserRepository = EntityRepository<User>

class UserInMemoryRepository extends InMemoryRepository<
    UserRepository
> { }

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