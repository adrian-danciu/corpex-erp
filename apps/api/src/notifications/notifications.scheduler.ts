import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  DocumentType,
  Employee,
  EmployeeDocument,
  VehicleDocument,
  Vehicle,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

const SETTINGS_ID = 'singleton';

const DEFAULT_THRESHOLDS: Record<DocumentType, number> = {
  ITP: 30,
  RCA: 30,
  CASCO: 30,
  ROVINIETA: 7,
};
const EMPLOYEE_DOCUMENT_EXPIRY_THRESHOLD_DAYS = 30;

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Daily scan of vehicle documents expiring within the configured threshold
   * window per document type. The 24h dedup in NotificationsService prevents
   * the same recipient from getting repeated alerts for the same document.
   *
   * Runs at 06:00 server time. We use UTC (CronExpression.EVERY_DAY_AT_6AM)
   * rather than Europe/Bucharest to avoid relying on Node ICU locale data
   * being available on the deploy target. 06:00 UTC = 08:00 EET / 09:00 EEST.
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async scanFleetDocumentExpiry(): Promise<void> {
    this.logger.log('Running daily fleet document expiry scan');

    const settings = await this.prisma.companySettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    const thresholds: Record<DocumentType, number> = {
      ITP: settings?.fleetExpiryThresholdItp ?? DEFAULT_THRESHOLDS.ITP,
      RCA: settings?.fleetExpiryThresholdRca ?? DEFAULT_THRESHOLDS.RCA,
      CASCO: settings?.fleetExpiryThresholdCasco ?? DEFAULT_THRESHOLDS.CASCO,
      ROVINIETA:
        settings?.fleetExpiryThresholdRovinieta ?? DEFAULT_THRESHOLDS.ROVINIETA,
    };

    const today = startOfDayUtc(new Date());
    const maxThreshold = Math.max(...Object.values(thresholds));
    const horizon = addDays(today, maxThreshold);

    const candidates = await this.prisma.vehicleDocument.findMany({
      where: {
        expiryDate: { gte: today, lte: horizon },
      },
      include: { vehicle: true },
    });

    const expiring = candidates.filter((doc) => {
      const cutoff = addDays(today, thresholds[doc.type]);
      return doc.expiryDate <= cutoff;
    });

    if (!expiring.length) {
      this.logger.log('No documents expiring in any threshold window');
      return;
    }

    this.logger.log(
      `Emitting expiry notifications for ${expiring.length} documents`,
    );

    for (const doc of expiring as Array<
      VehicleDocument & { vehicle: Vehicle }
    >) {
      try {
        await this.notifications.notifyDocumentExpiring({
          documentId: doc.id,
          documentType: doc.type,
          vehicleId: doc.vehicleId,
          plateNumber: doc.vehicle.plateNumber,
          expiryDate: doc.expiryDate,
        });
      } catch (err) {
        this.logger.error(
          `Failed to emit notification for document ${doc.id}`,
          err,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async scanEmployeeDocumentExpiry(): Promise<void> {
    this.logger.log('Running daily employee document expiry scan');

    const today = startOfDayUtc(new Date());
    const horizon = addDays(today, EMPLOYEE_DOCUMENT_EXPIRY_THRESHOLD_DAYS);

    const expiring = await this.prisma.employeeDocument.findMany({
      where: {
        expiryDate: { gte: today, lte: horizon },
      },
      include: { employee: true },
    });

    if (!expiring.length) {
      this.logger.log('No employee documents expiring soon');
      return;
    }

    this.logger.log(
      `Emitting expiry notifications for ${expiring.length} employee documents`,
    );

    for (const doc of expiring as Array<
      EmployeeDocument & { employee: Employee }
    >) {
      if (!doc.expiryDate) continue;
      try {
        await this.notifications.notifyEmployeeDocumentExpiring({
          documentId: doc.id,
          documentType: doc.type,
          documentTitle: doc.title,
          employeeName: `${doc.employee.firstName} ${doc.employee.lastName}`,
          expiryDate: doc.expiryDate,
        });
      } catch (err) {
        this.logger.error(
          `Failed to emit notification for employee document ${doc.id}`,
          err,
        );
      }
    }
  }
}

function startOfDayUtc(d: Date): Date {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}
