class ConstructionCalculator:
    """
    Helper class for deterministic construction calculations with multi-country/currency support.
    """
    
    # Base Rates in Local Currency of the Country
    COUNTRY_DATA = {
        "India": {
            "currency": "INR",
            "rates": {
                "basic_cost_per_sqft": 1800,
                "premium_cost_per_sqft": 2500,
                "cement_bag_price": 380,
                "steel_kg_price": 65,
                "sand_ton_price": 2000,
                "aggregate_ton_price": 1200,
                "brick_price": 10,
                "skilled_wage": 800,
                "unskilled_wage": 500,
                "worker_efficiency_sqft": 250 # sqft per worker per day
            }
        },
        "USA": {
            "currency": "USD",
            "rates": {
                "basic_cost_per_sqft": 150, # Dollars
                "premium_cost_per_sqft": 250,
                "cement_bag_price": 15,    # ~$15/bag
                "steel_kg_price": 1.5,     # ~$1.5/kg
                "sand_ton_price": 25,
                "aggregate_ton_price": 30,
                "brick_price": 0.80,
                "skilled_wage": 300,       # $300/day
                "unskilled_wage": 180,
                "worker_efficiency_sqft": 400 # Higher efficiency due to tech/methods/prefab
            }
        }
    }

    # Simple fixed exchange rates (would normally be live API)
    EXCHANGE_RATES = {
        "USD": 1.0,      # Base
        "INR": 83.0,     # 1 USD = 83 INR
        "EUR": 0.92,     # 1 USD = 0.92 EUR
        "GBP": 0.79      # 1 USD = 0.79 GBP
    }

    @staticmethod
    def convert_currency(amount, from_currency, to_currency):
        """
        Convert amount from source currency to target currency.
        Strategy: Convert to USD first (Base), then to Target.
        """
        if from_currency == to_currency:
            return amount
            
        # Convert to USD base
        amount_in_usd = amount / ConstructionCalculator.EXCHANGE_RATES[from_currency]
        
        # Convert to Target
        amount_in_target = amount_in_usd * ConstructionCalculator.EXCHANGE_RATES[to_currency]
        return amount_in_target

    @staticmethod
    def calculate_material_estimates(area_sqft, floors):
        """
        Estimate materials for a given area (in sq ft) and number of floors.
        """
        total_sq_ft = area_sqft * (floors + 1)
        
        # Approximate material consumption constants per sq ft of built-up area
        materials = {
            "cement_bags": int(total_sq_ft * 0.45),
            "steel_kg": int(total_sq_ft * 4),
            "sand_tons": int(total_sq_ft * 0.081),
            "aggregate_tons": int(total_sq_ft * 0.06),
            "bricks": int(total_sq_ft * 8),
            "total_built_up_area_sqft": total_sq_ft
        }
        return materials

    @staticmethod
    def calculate_cost_breakdown(area_sqft, floors, quality="standard", country="India", target_currency="INR"):
        # Default to India if country not found
        country_data = ConstructionCalculator.COUNTRY_DATA.get(country, ConstructionCalculator.COUNTRY_DATA["India"])
        rates = country_data["rates"]
        local_currency = country_data["currency"]
        
        # Determine Rate based on Quality
        if quality.lower() == "premium":
            rate_per_sqft = rates["premium_cost_per_sqft"]
        elif quality.lower() == "budget" or quality.lower() == "low cost":
            rate_per_sqft = rates["basic_cost_per_sqft"] * 0.8
        else:
            rate_per_sqft = rates["basic_cost_per_sqft"]
        
        total_sq_ft = area_sqft * (floors + 1)
        total_project_cost_local = total_sq_ft * rate_per_sqft
        
        # --- DETAILED MATERIAL COSTING (Local Currency) ---
        materials_qty = ConstructionCalculator.calculate_material_estimates(area_sqft, floors)
        
        material_costs_local = {
            "cement": materials_qty["cement_bags"] * rates["cement_bag_price"],
            "steel": materials_qty["steel_kg"] * rates["steel_kg_price"],
            "sand": materials_qty["sand_tons"] * rates["sand_ton_price"],
            "aggregate": materials_qty["aggregate_tons"] * rates["aggregate_ton_price"],
            "bricks": materials_qty["bricks"] * rates["brick_price"]
        }
        
        # Total Material Budget is roughly 60% of total project cost
        total_material_budget_local = total_project_cost_local * 0.60
        core_materials_cost_local = sum(material_costs_local.values())
        
        # Finishing materials (Paint, Tiles, Wood, Plumbing, Electrical)
        finishing_cost_local = total_material_budget_local - core_materials_cost_local
        material_costs_local["finishing_and_fittings"] = int(finishing_cost_local)
        
        # --- LABOR COSTING (Local Currency) ---
        total_labor_budget_local = total_project_cost_local * 0.25
        
        skilled_wage = rates["skilled_wage"]
        unskilled_wage = rates["unskilled_wage"]
        
        # Workforce Estimation
        recommended_workers = max(5, int(total_sq_ft / rates["worker_efficiency_sqft"]))
        
        skilled_workers = max(1, int(recommended_workers / 3))
        unskilled_workers = recommended_workers - skilled_workers
        
        daily_team_cost_local = (skilled_workers * skilled_wage) + (unskilled_workers * unskilled_wage)
        
        project_duration_days = int(total_labor_budget_local / daily_team_cost_local)
        
        # --- CONVERT EVERYTHING TO TARGET CURRENCY ---
        def convert(amt):
            return int(ConstructionCalculator.convert_currency(amt, local_currency, target_currency))

        total_project_cost = convert(total_project_cost_local)
        
        material_costs = {k: convert(v) for k, v in material_costs_local.items()}
        total_material_budget = convert(total_material_budget_local)
        
        labor_breakdown = {
            "skilled": {
                "workforce": skilled_workers,
                "duration": project_duration_days,
                "daily_wage": convert(skilled_wage),
                "total_cost": convert(skilled_workers * project_duration_days * skilled_wage)
            },
            "unskilled": {
                "workforce": unskilled_workers,
                "duration": project_duration_days,
                "daily_wage": convert(unskilled_wage),
                "total_cost": convert(unskilled_workers * project_duration_days * unskilled_wage)
            },
            "total_days": project_duration_days,
            "total_workforce": recommended_workers,
            "total_labor_cost": convert(total_labor_budget_local)
        }
        
        # --- FINAL JSON STRUCTURE ---
        breakdown = {
            "total_estimated_cost": total_project_cost,
            "currency": target_currency,
            "country": country,
            "material_cost_breakdown": material_costs,
            "labor_breakdown": labor_breakdown,
            "architect_fees": int(total_project_cost * 0.05),
            "contingency": int(total_project_cost * 0.10),
            "summary_breakdown": {
                "material": int(total_material_budget),
                "labor": convert(total_labor_budget_local),
                "other": int(total_project_cost * 0.15) 
            }
        }
        return breakdown
