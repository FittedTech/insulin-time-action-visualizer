from datetime import datetime, timedelta
import pytz
import pprint
 
# Medication half-lives dictionary
HALF_LIVES = {
    # Opioids
    "oxycodone": 3.2,               # in hours
    "hydrocodone": 4.0,             # in hours
    "morphine": 2.75,               # median of 2.5-3.0 hours
    "fentanyl": 3.7,                # in hours (transdermal; IV half-life is shorter)
    "codeine": 3.0,                 # in hours
    "methadone": 33.5,              # median of 8-59 hours (highly variable)
    "buprenorphine": 33.0,          # median of 24-42 hours
    "tramadol": 6.3,                # in hours
    "hydromorphone": 2.5,           # median of 2-3 hours
    "oxymorphone": 8.0,             # median of 7-9 hours
    "tapentadol": 4.0,              # in hours

    # Stimulants
    "amphetamine": 11.5,            # median of 9-14 hours
    "methylphenidate": 2.5,         # median of 2-3 hours
    "dextroamphetamine": 11.0,      # median of 10-12 hours
    "lisdexamfetamine": 11.5,       # median of 10-13 hours
    "modafinil": 13.5,              # median of 12-15 hours
    "cocaine": 1.0,                 # median of 0.5-1.5 hours
    "caffeine": 4.0,                # median of 3-5 hours

    # Benzodiazepines
    "alprazolam": 13.5,             # median of 11-16 hours
    "lorazepam": 15.0,              # median of 10-20 hours
    "diazepam": 35.0,               # median of 20-50 hours (active metabolite excluded)
    "clonazepam": 34.0,             # median of 18-50 hours
    "temazepam": 15.0,              # median of 8-22 hours
    "midazolam": 2.0,               # median of 1.5-2.5 hours
    "chlordiazepoxide": 17.5,       # median of 5-30 hours (active metabolite excluded)
    "flurazepam": 2.5,              # median of 2-3 hours (active metabolite excluded)
    "triazolam": 3.5,               # median of 1.5-5.5 hours
}


# Function to calculate remaining medication amount using half-life
def remaining_dose(dose, hours_elapsed, half_life):
    return dose * (0.5 ** (hours_elapsed / half_life))

# Define the timezone
tz = pytz.timezone("America/New_York")  # Change to your local timezone if needed

# Medication history with timezone-aware datetimes
medications = [
    {"time": tz.localize(datetime(2024, 11, 4, 8, 46)), "dose": 5, "type": "oxycodone"}, 
    {"time": tz.localize(datetime(2024, 11, 5, 10, 35)), "dose": 5, "type": "oxycodone"},
    {"time": tz.localize(datetime(2024, 11, 6, 17, 39)), "dose": 5, "type": "oxycodone"}
]

# Target times with timezone-aware datetimes
target_times = [
    tz.localize(datetime(2024, 11, 6, 22, 0)),  # November 6, 2024 at 10pm
    tz.localize(datetime(2024, 11, 7, 18, 0))   # November 7, 2024 at 6pm
]

# Calculate remaining medication at each target time
results = {time: {"oxycodone": 0, "hydrocodone": 0} for time in target_times}

for med in medications:
    med_time = med["time"]
    med_type = med["type"]
    for target_time in target_times:
        hours_elapsed = (target_time - med_time).total_seconds() / 3600
        if hours_elapsed > 0:
            # Use the HALF_LIVES dictionary for dynamic lookup
            half_life = HALF_LIVES.get(med_type)
            if half_life:
                results[target_time][med_type] += remaining_dose(med["dose"], hours_elapsed, half_life)

# Output
pprint.pprint(results, width=40)
