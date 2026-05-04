import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
    .use(swagger({
        documentation: {
            info: {
                title: 'Copyprompts API',
                version: '1.0.0'
            }
        },
        path: '/docs'
    }))
    .use(cors())
    .get('/', () => 'Hello from Elysia Backend')
    .get('/api/hello', () => ({
        message: 'Hello World from Backend',
        timestamp: Date.now()
    }))
    .listen(3001)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
