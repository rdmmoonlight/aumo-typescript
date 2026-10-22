import { Module } from '@nestjs/common';
import { ExampleController } from './example.controller.js';
import { ExampleService } from './example.service.js';

@Module({
    controllers: [ExampleController],
    providers: [ExampleService],
    exports: [ExampleService],
})
export class ExampleModule { }