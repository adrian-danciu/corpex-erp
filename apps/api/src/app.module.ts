import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { FinanceModule } from './finance/finance.module';
import { ReportingModule } from './reporting/reporting.module';
import { StockModule } from './stock/stock.module';
import { FleetModule } from './fleet/fleet.module';
import { SettingsModule } from './settings/settings.module';
import { ProjectsModule } from './projects/projects.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PayrollModule } from './payroll/payroll.module';

@Module({
  imports: [
    // Environment Configuration - Load .env file
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
      envFilePath: '.env',
    }),
    // GraphQL Configuration
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true, // Enable GraphQL Playground for development
      introspection: true, // Enable introspection
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }), // Pass request/response to context
    }),
    // Cron / scheduled jobs
    ScheduleModule.forRoot(),
    // Database
    PrismaModule,
    // Feature Modules
    AuthModule,
    UsersModule,
    EmployeesModule,
    FinanceModule,
    ReportingModule,
    StockModule,
    FleetModule,
    SettingsModule,
    ProjectsModule,
    NotificationsModule,
    PayrollModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
