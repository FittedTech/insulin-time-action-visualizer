# Constants
body_weight_kg = 265 * 0.453592  # Convert pounds to kilograms
alcohol_percent = 0.068  # Average ABV of Trickster IPA (6.8%)
standard_drink_alcohol_g = 14  # grams of alcohol in a standard drink
beer_volume_ml = 473  # Volume of one pint of beer in milliliters
density_of_ethanol = 0.789  # Density of ethanol in g/ml

# Calculate total alcohol consumed
total_volume_ml = 2 * beer_volume_ml  # Total volume for 2 pints
total_alcohol_ml = total_volume_ml * alcohol_percent
total_alcohol_g = total_alcohol_ml * density_of_ethanol

# Body water constant for males
body_water_constant = 0.58

# Calculate blood alcohol content (BAC)
body_water_kg = body_weight_kg * body_water_constant
bac = (total_alcohol_g / (body_water_kg * 1000)) * 100

# Alcohol metabolism rate per hour (average)
metabolism_rate_per_hour = 0.015

# Time elapsed since drinking began
time_elapsed_hours = (7 - 4.5)  # From 4:30 to 7:00

# BAC reduction over time
bac_reduction = metabolism_rate_per_hour * time_elapsed_hours

# Calculate current BAC
current_bac = max(0, bac - bac_reduction)

# Approximate grams of alcohol remaining in the body
alcohol_remaining_g = current_bac * body_water_kg * 10

# Convert gram to standard units of alcohol
standard_units_of_alcohol = alcohol_remaining_g / standard_drink_alcohol_g

# Emit info
print "Body weight: %.2f kg" % body_weight_kg
print "Total alcohol consumed: %.2f grams" % total_alcohol_g
print "Blood alcohol content: %.4f%%" % bac
print "Current blood alcohol content: %.4f%%" % current_bac
print "Approximate grams of alcohol remaining in the body: %.2f grams" %
