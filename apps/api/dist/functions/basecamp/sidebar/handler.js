"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
function queryAll(pk, prefix) {
    return db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
        TableName: db_1.TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': pk, ':prefix': prefix },
    }));
}
function normalizeToMonthly(amount, billingCycle) {
    switch (billingCycle) {
        case 'WEEKLY': return amount * 52 / 12;
        case 'BIWEEKLY': return amount * 26 / 12;
        case 'MONTHLY': return amount;
        case 'QUARTERLY': return amount / 3;
        case 'ANNUALLY': return amount / 12;
        default: return amount;
    }
}
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const [profileResult, expeditionsResult, trainingResult, gearResult, landmarksResult, summitsResult, pathfindingResult, companionsResult, supplylineResult, burnResult, cacheResult, signalsResult, stopsResult,] = await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.GetCommand({ TableName: db_1.TABLE_NAME, Key: { pk, sk: 'PROFILE' } })),
            queryAll(pk, 'EXPEDITION#'),
            queryAll(pk, 'TRAINING#'),
            queryAll(pk, 'GEAR#'),
            queryAll(pk, 'LANDMARK#'),
            queryAll(pk, 'SUMMIT#'),
            queryAll(pk, 'PATHFINDING#'),
            queryAll(pk, 'COMPANION#'),
            queryAll(pk, 'SUPPLYLINE#'),
            queryAll(pk, 'BURN#'),
            queryAll(pk, 'CACHE#'),
            queryAll(pk, 'SIGNAL#'),
            queryAll(pk, 'STOP#'),
        ]);
        const profile = profileResult.Item ?? {};
        const expeditions = expeditionsResult.Items ?? [];
        const training = trainingResult.Items ?? [];
        const gear = gearResult.Items ?? [];
        const landmarks = landmarksResult.Items ?? [];
        const summits = summitsResult.Items ?? [];
        const pathfinding = pathfindingResult.Items ?? [];
        const companions = companionsResult.Items ?? [];
        const supplylines = supplylineResult.Items ?? [];
        const burns = burnResult.Items ?? [];
        const caches = cacheResult.Items ?? [];
        const signals = (signalsResult.Items ?? []).filter((s) => !s.sk.includes('#REPLY#'));
        const stops = stopsResult.Items ?? [];
        // Manifest highlights
        const sortedExpeditions = [...expeditions].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        const mostRecentExpedition = sortedExpeditions[0]
            ? { title: sortedExpeditions[0].title, company: sortedExpeditions[0].company }
            : null;
        const sortedTraining = [...training].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        const mostRecentTraining = sortedTraining[0]
            ? { institution: sortedTraining[0].institution, degree: sortedTraining[0].degree ?? null }
            : null;
        let totalYearsExperience = 0;
        for (const exp of expeditions) {
            const start = new Date(exp.startDate);
            const end = exp.endDate ? new Date(exp.endDate) : new Date();
            totalYearsExperience += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        }
        const topGear = gear.slice(0, 5).map((g) => ({ name: g.name }));
        // Provisions summary
        const activeSupplylines = supplylines.filter((s) => s.active);
        const monthlyTotal = activeSupplylines.reduce((sum, s) => sum + normalizeToMonthly(s.amount, s.billingCycle), 0);
        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthBurns = burns.filter((b) => b.date?.startsWith(monthPrefix));
        const monthlyBurn = monthBurns.reduce((sum, b) => sum + b.amount, 0);
        const monthCaches = caches.filter((c) => {
            const parts = c.sk.split('#');
            return parts[2] === String(now.getMonth() + 1) && parts[3] === String(now.getFullYear());
        });
        const cacheTotalLimit = monthCaches.reduce((sum, c) => sum + (c.limit ?? 0), 0);
        const cacheTotalSpent = monthCaches.reduce((sum, c) => {
            const markerId = c.sk.split('#')[1];
            return sum + monthBurns
                .filter((b) => b.markers?.some((m) => m.id === markerId))
                .reduce((s, b) => s + b.amount, 0);
        }, 0);
        const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingRenewals = activeSupplylines.filter((s) => {
            const renewal = new Date(s.nextRenewal);
            return renewal >= now && renewal <= sevenDaysOut;
        }).length;
        // Signals summary
        const unreadCount = signals.filter((s) => !s.read).length;
        const latestMessages = [...signals]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
            .map((s) => ({
            id: s.sk.split('#')[1],
            senderName: s.senderName,
            body: s.body,
            createdAt: s.createdAt,
            read: s.read ?? false,
        }));
        // Itinerary summary (upcoming stops, next 4 days)
        const fourDaysOut = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
        const upcomingStops = stops
            .filter((s) => {
            const start = new Date(s.startDate);
            return start >= now && start <= fourDaysOut;
        })
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .map((s) => ({
            id: s.sk.split('#')[1],
            title: s.title,
            startDate: s.startDate,
            endDate: s.endDate ?? null,
            allDay: s.allDay ?? false,
            color: s.markers?.[0]?.color ?? '#007AFF',
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({
            wayfarer: {
                name: profile.name ?? null,
                email: profile.email ?? null,
                image: profile.image ?? null,
                username: profile.username ?? null,
                origins: {
                    headline: profile.headline ?? null,
                    location: profile.location ?? null,
                    website: profile.website ?? null,
                    linkedin: profile.linkedin ?? null,
                    github: profile.github ?? null,
                },
            },
            manifestCounts: {
                expeditions: expeditions.length,
                training: training.length,
                gear: gear.length,
                landmarks: landmarks.length,
                summits: summits.length,
                pathfinding: pathfinding.length,
                companions: companions.length,
            },
            manifestHighlights: {
                totalYearsExperience: Math.round(totalYearsExperience),
                mostRecentExpedition,
                mostRecentTraining,
                topGear,
            },
            provisionsSummary: {
                monthlyTotal,
                monthlyBurn,
                cacheTotalLimit,
                cacheTotalSpent,
                activeCount: activeSupplylines.length,
                upcomingRenewals,
            },
            signalsSummary: {
                unreadCount,
                latestMessages,
                emailAccounts: [],
            },
            itinerarySummary: {
                stops: upcomingStops,
            },
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map