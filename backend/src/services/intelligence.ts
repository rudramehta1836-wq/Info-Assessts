export function calculateRiskScore(asset: any, workOrders: any[] = []) {
  // 1. Condition factor (0 to 40 points)
  // condition_score is 1 (worst) to 5 (best)
  const conditionFactor = (5 - asset.condition_score) * 10; // 5 -> 0, 1 -> 40

  // 2. Age factor (0 to 30 points)
  const ageYears = (new Date().getTime() - new Date(asset.install_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
  const lifeRatio = Math.min(1, ageYears / asset.expected_useful_life_years);
  const ageFactor = lifeRatio * 30;

  // 3. Maintenance factor (0 to 15 points)
  const openOrOverdueWOs = workOrders.filter(w => w.status !== 'Done');
  const hasOverdue = openOrOverdueWOs.some(w => new Date(w.due_date) < new Date());
  const maintenanceFactor = hasOverdue ? 15 : (openOrOverdueWOs.length > 0 ? 5 : 0);

  // 4. Criticality factor (0 to 15 points)
  // criticality is 1 to 5
  const criticalityFactor = ((asset.criticality || 3) - 1) * 3.75; // max 15 points

  const totalRisk = Math.min(100, Math.round(conditionFactor + ageFactor + maintenanceFactor + criticalityFactor));

  return {
    score: totalRisk,
    breakdown: {
      condition: Math.round(conditionFactor),
      age: Math.round(ageFactor),
      maintenance: Math.round(maintenanceFactor),
      criticality: Math.round(criticalityFactor)
    }
  };
}

export function getPredictiveMaintenance(asset: any, riskScore: number) {
  if (riskScore > 80) {
    return {
      window: 'Immediate (0-14 days)',
      recommendation: 'Emergency Replacement / Critical Overhaul',
      urgency: 'Critical'
    };
  } else if (riskScore > 50) {
    return {
      window: 'Near Term (30-90 days)',
      recommendation: 'Preventative Maintenance / Detailed Inspection',
      urgency: 'High'
    };
  } else if (riskScore > 30) {
    return {
      window: 'Mid Term (6-12 months)',
      recommendation: 'Routine Servicing',
      urgency: 'Medium'
    };
  } else {
    return {
      window: 'Long Term (1-3 years)',
      recommendation: 'Standard Monitoring',
      urgency: 'Low'
    };
  }
}

export function calculateLifecycleCost(asset: any, workOrders: any[]) {
  const acquisitionCost = asset.cost;
  const maintenanceCost = workOrders.reduce((sum, wo) => sum + (wo.cost || 0), 0);
  const totalCost = acquisitionCost + maintenanceCost;
  
  const ageYears = (new Date().getTime() - new Date(asset.install_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
  const depreciationPerYear = acquisitionCost / asset.expected_useful_life_years;
  const currentDepreciatedValue = Math.max(0, acquisitionCost - (depreciationPerYear * ageYears));

  return {
    acquisitionCost,
    maintenanceCost,
    totalCost,
    currentDepreciatedValue
  };
}

export function calculateCapitalPlan(assets: any[], budgetCapPerYear: number = 500000) {
  const currentYear = new Date().getFullYear();
  const plan = [];
  
  for (let i = 0; i < 5; i++) {
    const year = currentYear + i;
    
    // Calculate which assets are expected to fail this year
    let assetsToReplace = assets.filter(a => {
      const expectedEndYear = new Date(a.install_date).getFullYear() + a.expected_useful_life_years;
      return expectedEndYear === year;
    });
    
    // Sort by criticality descending
    assetsToReplace = assetsToReplace.sort((a, b) => (b.criticality || 3) - (a.criticality || 3));
    
    let allocatedBudget = 0;
    let deferredCount = 0;
    let deferredCost = 0;
    let baselineMaintenance = assets.length * 1000; // rough baseline maintenance cost
    
    allocatedBudget += baselineMaintenance;
    
    const replacements = [];
    for (const a of assetsToReplace) {
      if (allocatedBudget + a.cost <= budgetCapPerYear) {
        allocatedBudget += a.cost;
        replacements.push(a);
      } else {
        deferredCount++;
        deferredCost += a.cost;
      }
    }
    
    plan.push({
      year,
      totalBudgetAllocated: allocatedBudget,
      maintenanceCost: baselineMaintenance,
      replacementCost: allocatedBudget - baselineMaintenance,
      replacementsFunded: replacements.length,
      deferredCount,
      deferredCost
    });
  }
  
  return plan;
}
