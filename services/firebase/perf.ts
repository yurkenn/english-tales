import perf, { FirebasePerformanceTypes } from '@react-native-firebase/perf';

/**
 * Service for native Firebase Performance Monitoring.
 * Tracks app performance metrics like startup time, network requests, and custom traces.
 */
class PerformanceService {
    private traces: Map<string, FirebasePerformanceTypes.Trace> = new Map();

    /**
     * Start a performance trace
     * @param traceName - Unique name for the trace
     */
    async startTrace(traceName: string): Promise<void> {
        console.log(`[Firebase Performance] Starting trace: ${traceName}`);
        try {
            const trace = await perf().startTrace(traceName);
            this.traces.set(traceName, trace);
        } catch (error) {
            console.error(`[Firebase Performance] Failed to start trace "${traceName}"`, error);
        }
    }

    /**
     * Stop a performance trace
     * @param traceName - Name of the trace to stop
     */
    async stopTrace(traceName: string): Promise<void> {
        console.log(`[Firebase Performance] Stopping trace: ${traceName}`);
        try {
            const trace = this.traces.get(traceName);
            if (trace) {
                await trace.stop();
                this.traces.delete(traceName);
            } else {
                console.warn(`[Firebase Performance] Trace "${traceName}" not found`);
            }
        } catch (error) {
            console.error(`[Firebase Performance] Failed to stop trace "${traceName}"`, error);
        }
    }

    /**
     * Add a metric to an active trace
     * @param traceName - Name of the trace
     * @param metricName - Name of the metric
     * @param value - Value of the metric
     */
    async putMetric(traceName: string, metricName: string, value: number): Promise<void> {
        try {
            const trace = this.traces.get(traceName);
            if (trace) {
                trace.putMetric(metricName, value);
            } else {
                console.warn(`[Firebase Performance] Trace "${traceName}" not found for metric`);
            }
        } catch (error) {
            console.error(`[Firebase Performance] Failed to put metric`, error);
        }
    }

    /**
     * Increment a metric in an active trace
     * @param traceName - Name of the trace
     * @param metricName - Name of the metric
     * @param incrementBy - Value to increment by (default: 1)
     */
    async incrementMetric(traceName: string, metricName: string, incrementBy: number = 1): Promise<void> {
        try {
            const trace = this.traces.get(traceName);
            if (trace) {
                trace.incrementMetric(metricName, incrementBy);
            } else {
                console.warn(`[Firebase Performance] Trace "${traceName}" not found for incrementing metric`);
            }
        } catch (error) {
            console.error(`[Firebase Performance] Failed to increment metric`, error);
        }
    }

    /**
     * Add an attribute to an active trace
     * @param traceName - Name of the trace
     * @param attribute - Attribute name
     * @param value - Attribute value
     */
    async putAttribute(traceName: string, attribute: string, value: string): Promise<void> {
        try {
            const trace = this.traces.get(traceName);
            if (trace) {
                trace.putAttribute(attribute, value);
            } else {
                console.warn(`[Firebase Performance] Trace "${traceName}" not found for attribute`);
            }
        } catch (error) {
            console.error(`[Firebase Performance] Failed to put attribute`, error);
        }
    }

    /**
     * Enable or disable HTTP metrics collection
     * @param enabled - Whether to enable HTTP metrics
     */
    async setHttpMetricsEnabled(enabled: boolean): Promise<void> {
        console.log(`[Firebase Performance] HTTP metrics enabled: ${enabled}`);
        try {
            await perf().setPerformanceCollectionEnabled(enabled);
        } catch (error) {
            console.error('[Firebase Performance] Failed to set HTTP metrics', error);
        }
    }

    /**
     * Enable or disable performance collection
     * @param enabled - Whether to enable performance collection
     */
    async setPerformanceCollectionEnabled(enabled: boolean): Promise<void> {
        console.log(`[Firebase Performance] Collection enabled: ${enabled}`);
        try {
            await perf().setPerformanceCollectionEnabled(enabled);
        } catch (error) {
            console.error('[Firebase Performance] Failed to set collection enabled', error);
        }
    }

    /**
     * Create an HTTP metric for network request tracking
     * @param url - The URL being requested
     * @param httpMethod - The HTTP method (GET, POST, etc.)
     */
    async newHttpMetric(url: string, httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT') {
        try {
            return perf().newHttpMetric(url, httpMethod);
        } catch (error) {
            console.error('[Firebase Performance] Failed to create HTTP metric', error);
            return null;
        }
    }
}

export const performanceService = new PerformanceService();
