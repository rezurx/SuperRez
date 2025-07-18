"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsensusEngine = exports.ConsensusMethod = void 0;
const vscode = require("vscode");
const ss = require("simple-statistics");
var ConsensusMethod;
(function (ConsensusMethod) {
    ConsensusMethod["SIMPLE_MAJORITY"] = "simple_majority";
    ConsensusMethod["WEIGHTED_MAJORITY"] = "weighted_majority";
    ConsensusMethod["CONFIDENCE_WEIGHTED"] = "confidence_weighted";
    ConsensusMethod["BYZANTINE_FAULT_TOLERANT"] = "byzantine_fault_tolerant";
    ConsensusMethod["RANK_AGGREGATION"] = "rank_aggregation";
    ConsensusMethod["FUZZY_CONSENSUS"] = "fuzzy_consensus";
    ConsensusMethod["COST_OPTIMIZED"] = "cost_optimized";
})(ConsensusMethod = exports.ConsensusMethod || (exports.ConsensusMethod = {}));
class ConsensusEngine {
    constructor(costTracker) {
        this.costTracker = costTracker;
        this.outputChannel = vscode.window.createOutputChannel('SuperRez Consensus Engine');
    }
    async processVotes(votes, method = ConsensusMethod.CONFIDENCE_WEIGHTED, options = {}) {
        const startTime = Date.now();
        try {
            this.outputChannel.appendLine(`Processing ${votes.length} votes using ${method}`);
            let result;
            switch (method) {
                case ConsensusMethod.SIMPLE_MAJORITY:
                    result = this.simpleMajorityConsensus(votes);
                    break;
                case ConsensusMethod.WEIGHTED_MAJORITY:
                    result = this.weightedMajorityConsensus(votes, options);
                    break;
                case ConsensusMethod.CONFIDENCE_WEIGHTED:
                    result = this.confidenceWeightedConsensus(votes);
                    break;
                case ConsensusMethod.BYZANTINE_FAULT_TOLERANT:
                    result = this.byzantineFaultTolerantConsensus(votes);
                    break;
                case ConsensusMethod.RANK_AGGREGATION:
                    result = this.rankAggregationConsensus(votes);
                    break;
                case ConsensusMethod.FUZZY_CONSENSUS:
                    result = this.fuzzyConsensus(votes);
                    break;
                case ConsensusMethod.COST_OPTIMIZED:
                    result = this.costOptimizedConsensus(votes);
                    break;
                default:
                    result = this.confidenceWeightedConsensus(votes);
            }
            // Calculate final metrics
            result.metrics.convergenceTime = Date.now() - startTime;
            result.metrics = this.calculateMetrics(votes, result);
            this.outputChannel.appendLine(`Consensus reached: ${result.finalDecision} (confidence: ${result.confidence.toFixed(3)})`);
            return result;
        }
        catch (error) {
            this.outputChannel.appendLine(`Consensus processing failed: ${error}`);
            throw error;
        }
    }
    simpleMajorityConsensus(votes) {
        const voteCounts = new Map();
        // Count votes for each option
        votes.forEach(vote => {
            const count = voteCounts.get(vote.recommendation) || 0;
            voteCounts.set(vote.recommendation, count + 1);
        });
        // Find majority winner
        let winner = '';
        let maxVotes = 0;
        for (const [option, count] of voteCounts) {
            if (count > maxVotes) {
                maxVotes = count;
                winner = option;
            }
        }
        const confidence = maxVotes / votes.length;
        const alternatives = this.calculateAlternatives(votes, winner);
        return {
            finalDecision: winner,
            confidence,
            method: ConsensusMethod.SIMPLE_MAJORITY,
            votes,
            metrics: {},
            reasoning: `Simple majority consensus: ${maxVotes}/${votes.length} agents agreed on "${winner}"`,
            alternatives
        };
    }
    weightedMajorityConsensus(votes, options) {
        const voteWeights = new Map();
        const weightFunction = options.weightFunction || this.defaultWeightFunction;
        // Calculate weighted votes
        votes.forEach(vote => {
            const weight = weightFunction(vote);
            const currentWeight = voteWeights.get(vote.recommendation) || 0;
            voteWeights.set(vote.recommendation, currentWeight + weight);
        });
        // Find weighted winner
        let winner = '';
        let maxWeight = 0;
        let totalWeight = 0;
        for (const [option, weight] of voteWeights) {
            totalWeight += weight;
            if (weight > maxWeight) {
                maxWeight = weight;
                winner = option;
            }
        }
        const confidence = maxWeight / totalWeight;
        const alternatives = this.calculateAlternatives(votes, winner);
        return {
            finalDecision: winner,
            confidence,
            method: ConsensusMethod.WEIGHTED_MAJORITY,
            votes,
            metrics: {},
            reasoning: `Weighted majority consensus: ${maxWeight.toFixed(2)}/${totalWeight.toFixed(2)} weighted votes for "${winner}"`,
            alternatives
        };
    }
    confidenceWeightedConsensus(votes) {
        const optionScores = new Map();
        const optionConfidences = new Map();
        // Calculate confidence-weighted scores
        votes.forEach(vote => {
            const currentScore = optionScores.get(vote.recommendation) || 0;
            const confidenceWeight = vote.confidence;
            optionScores.set(vote.recommendation, currentScore + confidenceWeight);
            const confidences = optionConfidences.get(vote.recommendation) || [];
            confidences.push(vote.confidence);
            optionConfidences.set(vote.recommendation, confidences);
        });
        // Find highest confidence-weighted option
        let winner = '';
        let maxScore = 0;
        let totalScore = 0;
        for (const [option, score] of optionScores) {
            totalScore += score;
            if (score > maxScore) {
                maxScore = score;
                winner = option;
            }
        }
        // Calculate overall confidence using harmonic mean of supporting votes
        const winnerConfidences = optionConfidences.get(winner) || [];
        const overallConfidence = winnerConfidences.length > 0
            ? ss.harmonicMean(winnerConfidences)
            : 0;
        const alternatives = this.calculateAlternatives(votes, winner);
        return {
            finalDecision: winner,
            confidence: overallConfidence,
            method: ConsensusMethod.CONFIDENCE_WEIGHTED,
            votes,
            metrics: {},
            reasoning: `Confidence-weighted consensus: "${winner}" with harmonic mean confidence ${overallConfidence.toFixed(3)}`,
            alternatives
        };
    }
    byzantineFaultTolerantConsensus(votes) {
        // Byzantine Fault Tolerant algorithm - assumes up to 1/3 agents can be faulty
        const n = votes.length;
        const f = Math.floor((n - 1) / 3); // Maximum faulty agents
        const requiredAgreement = 2 * f + 1; // Minimum for safety
        this.outputChannel.appendLine(`BFT: ${n} agents, assuming max ${f} faulty, need ${requiredAgreement} agreements`);
        // Remove outliers based on confidence and evidence
        const filteredVotes = this.removeOutliers(votes);
        // Group by recommendation
        const groups = new Map();
        filteredVotes.forEach(vote => {
            const group = groups.get(vote.recommendation) || [];
            group.push(vote);
            groups.set(vote.recommendation, group);
        });
        // Find group with sufficient agreement
        let winner = '';
        let winnerGroup = [];
        let maxSize = 0;
        for (const [option, group] of groups) {
            if (group.length >= requiredAgreement && group.length > maxSize) {
                maxSize = group.length;
                winner = option;
                winnerGroup = group;
            }
        }
        if (!winner) {
            // No Byzantine agreement possible, fall back to confidence-weighted
            this.outputChannel.appendLine('BFT: No Byzantine agreement possible, falling back to confidence-weighted');
            return this.confidenceWeightedConsensus(votes);
        }
        const confidence = this.calculateByzantineConfidence(winnerGroup, n, f);
        const alternatives = this.calculateAlternatives(votes, winner);
        return {
            finalDecision: winner,
            confidence,
            method: ConsensusMethod.BYZANTINE_FAULT_TOLERANT,
            votes,
            metrics: {},
            reasoning: `Byzantine Fault Tolerant consensus: ${maxSize}/${n} agents agreed, fault tolerance: ${f}`,
            alternatives
        };
    }
    rankAggregationConsensus(votes) {
        // Implement Borda count method for rank aggregation
        const options = [...new Set(votes.map(v => v.recommendation))];
        const scores = new Map();
        // Initialize scores
        options.forEach(option => scores.set(option, 0));
        // Calculate Borda scores (confidence-weighted)
        votes.forEach(vote => {
            const rank = options.indexOf(vote.recommendation);
            const score = (options.length - rank) * vote.confidence;
            const currentScore = scores.get(vote.recommendation) || 0;
            scores.set(vote.recommendation, currentScore + score);
        });
        // Find winner
        let winner = '';
        let maxScore = 0;
        let totalScore = 0;
        for (const [option, score] of scores) {
            totalScore += score;
            if (score > maxScore) {
                maxScore = score;
                winner = option;
            }
        }
        const confidence = maxScore / totalScore;
        const alternatives = this.calculateAlternatives(votes, winner);
        return {
            finalDecision: winner,
            confidence,
            method: ConsensusMethod.RANK_AGGREGATION,
            votes,
            metrics: {},
            reasoning: `Rank aggregation consensus using Borda count: "${winner}" scored ${maxScore.toFixed(2)}/${totalScore.toFixed(2)}`,
            alternatives
        };
    }
    fuzzyConsensus(votes) {
        // Fuzzy logic approach - handle partial agreements and similarities
        const options = [...new Set(votes.map(v => v.recommendation))];
        const fuzzyScores = new Map();
        // Calculate fuzzy membership scores
        options.forEach(option => {
            let fuzzyScore = 0;
            votes.forEach(vote => {
                const similarity = this.calculateSimilarity(vote.recommendation, option);
                const membershipScore = similarity * vote.confidence;
                fuzzyScore += membershipScore;
            });
            fuzzyScores.set(option, fuzzyScore);
        });
        // Find highest fuzzy score
        let winner = '';
        let maxScore = 0;
        let totalScore = 0;
        for (const [option, score] of fuzzyScores) {
            totalScore += score;
            if (score > maxScore) {
                maxScore = score;
                winner = option;
            }
        }
        const confidence = maxScore / totalScore;
        const alternatives = this.calculateAlternatives(votes, winner);
        return {
            finalDecision: winner,
            confidence,
            method: ConsensusMethod.FUZZY_CONSENSUS,
            votes,
            metrics: {},
            reasoning: `Fuzzy consensus: "${winner}" with fuzzy score ${maxScore.toFixed(3)}/${totalScore.toFixed(3)}`,
            alternatives
        };
    }
    costOptimizedConsensus(votes) {
        // Optimize for cost-effectiveness while maintaining quality
        const costEfficiencyScores = new Map();
        // Group votes by recommendation
        const groups = new Map();
        votes.forEach(vote => {
            const group = groups.get(vote.recommendation) || [];
            group.push(vote);
            groups.set(vote.recommendation, group);
        });
        // Calculate cost-efficiency scores
        for (const [option, group] of groups) {
            const avgConfidence = group.reduce((sum, vote) => sum + vote.confidence, 0) / group.length;
            const totalCost = group.reduce((sum, vote) => sum + vote.cost, 0);
            const costEfficiency = (avgConfidence * group.length) / (totalCost + 0.01); // Avoid division by zero
            costEfficiencyScores.set(option, costEfficiency);
        }
        // Find most cost-efficient option
        let winner = '';
        let maxEfficiency = 0;
        for (const [option, efficiency] of costEfficiencyScores) {
            if (efficiency > maxEfficiency) {
                maxEfficiency = efficiency;
                winner = option;
            }
        }
        const winnerGroup = groups.get(winner) || [];
        const confidence = winnerGroup.reduce((sum, vote) => sum + vote.confidence, 0) / winnerGroup.length;
        const alternatives = this.calculateAlternatives(votes, winner);
        return {
            finalDecision: winner,
            confidence,
            method: ConsensusMethod.COST_OPTIMIZED,
            votes,
            metrics: {},
            reasoning: `Cost-optimized consensus: "${winner}" with efficiency score ${maxEfficiency.toFixed(3)}`,
            alternatives
        };
    }
    calculateMetrics(votes, result) {
        const winnerVotes = votes.filter(v => v.recommendation === result.finalDecision);
        const totalAgents = votes.length;
        const participatingAgents = votes.length; // All votes are participating
        // Agreement level: percentage of agents agreeing with final decision
        const agreementLevel = winnerVotes.length / totalAgents;
        // Confidence variance: measure of how much confidence varies
        const confidences = votes.map(v => v.confidence);
        const confidenceVariance = confidences.length > 1 ? ss.variance(confidences) : 0;
        // Cost efficiency: confidence per unit cost
        const totalCost = votes.reduce((sum, vote) => sum + vote.cost, 0);
        const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
        const costEfficiency = totalCost > 0 ? avgConfidence / totalCost : avgConfidence;
        // Consensus strength: weighted agreement considering confidence
        const consensusStrength = winnerVotes.reduce((sum, vote) => sum + vote.confidence, 0) / totalAgents;
        return {
            totalAgents,
            participatingAgents,
            agreementLevel,
            confidenceVariance,
            convergenceTime: result.metrics.convergenceTime || 0,
            costEfficiency,
            consensusStrength
        };
    }
    calculateAlternatives(votes, winner) {
        const options = new Map();
        // Group votes by recommendation
        votes.forEach(vote => {
            const group = options.get(vote.recommendation) || [];
            group.push(vote);
            options.set(vote.recommendation, group);
        });
        const alternatives = [];
        const totalVotes = votes.length;
        for (const [option, group] of options) {
            if (option !== winner) {
                const support = group.length / totalVotes;
                const averageConfidence = group.reduce((sum, vote) => sum + vote.confidence, 0) / group.length;
                const supportingAgents = group.map(vote => vote.agentName);
                alternatives.push({
                    option,
                    support,
                    averageConfidence,
                    supportingAgents
                });
            }
        }
        // Sort by support level
        return alternatives.sort((a, b) => b.support - a.support);
    }
    removeOutliers(votes) {
        // Remove votes with extremely low confidence or suspicious patterns
        const confidences = votes.map(v => v.confidence);
        const mean = ss.mean(confidences);
        const stdDev = ss.standardDeviation(confidences);
        const threshold = mean - 2 * stdDev; // 2 standard deviations below mean
        return votes.filter(vote => {
            // Keep votes with reasonable confidence
            if (vote.confidence < threshold) {
                this.outputChannel.appendLine(`Removing outlier vote from ${vote.agentName} (confidence: ${vote.confidence.toFixed(3)})`);
                return false;
            }
            // Keep votes with evidence
            if (vote.evidence.length === 0) {
                this.outputChannel.appendLine(`Removing vote from ${vote.agentName} (no evidence provided)`);
                return false;
            }
            return true;
        });
    }
    calculateByzantineConfidence(winnerGroup, totalAgents, maxFaulty) {
        // Calculate confidence for Byzantine agreement
        const groupSize = winnerGroup.length;
        const safetyMargin = groupSize - (2 * maxFaulty + 1);
        const maxSafetyMargin = totalAgents - (2 * maxFaulty + 1);
        // Base confidence from group consensus
        const baseConfidence = groupSize / totalAgents;
        // Safety margin bonus
        const safetyBonus = maxSafetyMargin > 0 ? safetyMargin / maxSafetyMargin : 0;
        // Average confidence of supporting agents
        const avgAgentConfidence = winnerGroup.reduce((sum, vote) => sum + vote.confidence, 0) / winnerGroup.length;
        // Combined confidence
        return Math.min(1.0, (baseConfidence + safetyBonus * 0.3) * avgAgentConfidence);
    }
    calculateSimilarity(text1, text2) {
        // Simple similarity calculation (can be enhanced with NLP)
        if (text1 === text2)
            return 1.0;
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        return union.length > 0 ? intersection.length / union.length : 0;
    }
    defaultWeightFunction(vote) {
        // Default weight combines confidence with evidence quality
        const baseWeight = vote.confidence;
        const evidenceBonus = Math.min(0.3, vote.evidence.length * 0.1);
        const costPenalty = Math.min(0.2, vote.cost * 0.01);
        return Math.max(0.1, baseWeight + evidenceBonus - costPenalty);
    }
    async resolveConflicts(conflictingOutputs) {
        this.outputChannel.appendLine(`Resolving ${conflictingOutputs.length} conflicting outputs`);
        // Convert conflicts to votes
        const votes = conflictingOutputs.map(output => ({
            agentId: output.agentId,
            agentName: output.agentName,
            recommendation: output.recommendation,
            confidence: output.confidence,
            reasoning: output.reasoning,
            evidence: output.evidence || [],
            cost: output.cost || 0,
            timestamp: new Date()
        }));
        // Use confidence-weighted consensus for conflict resolution
        const consensus = await this.processVotes(votes, ConsensusMethod.CONFIDENCE_WEIGHTED);
        return {
            resolvedOutput: consensus.finalDecision,
            method: 'consensus_based',
            confidence: consensus.confidence,
            participatingAgents: votes.map(v => v.agentName),
            conflictSeverity: this.calculateConflictSeverity(votes),
            resolution: consensus
        };
    }
    calculateConflictSeverity(votes) {
        const uniqueRecommendations = new Set(votes.map(v => v.recommendation));
        const disagreementRatio = uniqueRecommendations.size / votes.length;
        if (disagreementRatio < 0.3)
            return 'low';
        if (disagreementRatio < 0.7)
            return 'medium';
        return 'high';
    }
}
exports.ConsensusEngine = ConsensusEngine;
//# sourceMappingURL=consensusEngine.js.map