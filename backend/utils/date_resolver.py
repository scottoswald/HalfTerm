from datetime import datetime, timedelta
import pytz

def resolve_date(date_value: str) -> str:
    """
    Convert a relative date string into an exact date or date range.
    This is called before passing dates to the agent so Claude
    always receives precise dates rather than relative terms it has to interpret.

    For example:
    'today' -> 'today (Wednesday 20th May 2026)'
    'this weekend' -> 'this weekend (Saturday 23rd May and Sunday 24th May 2026)'
    'next week' -> 'next week (Monday 25th May to Sunday 31st May 2026)'
    """
    # Get current date in UK timezone
    # This ensures dates are correct for UK users regardless of server timezone
    uk_tz = pytz.timezone('Europe/London')
    now = datetime.now(uk_tz)
    today = now.date()

    # Helper to format a date as "Monday 20th May 2026"
    def format_date(d):
        # %-d removes the leading zero from the day number on Linux/Mac
        day = d.strftime('%-d')
        # Add the correct ordinal suffix (1st, 2nd, 3rd, 4th etc)
        if day in ('1', '21', '31'):
            suffix = 'st'
        elif day in ('2', '22'):
            suffix = 'nd'
        elif day in ('3', '23'):
            suffix = 'rd'
        else:
            suffix = 'th'
        return d.strftime(f'%A {day}{suffix} %B %Y')

    if date_value == 'today':
        return f"today ({format_date(today)})"

    elif date_value == 'tomorrow':
        tomorrow = today + timedelta(days=1)
        return f"tomorrow ({format_date(tomorrow)})"

    elif date_value == 'this weekend':
        # If today is Saturday (5) or Sunday (6) — we're already in the weekend
        # So "this weekend" means the current weekend we're in
        if today.weekday() == 5:
            # Today is Saturday — weekend is today and tomorrow
            saturday = today
            sunday = today + timedelta(days=1)
        elif today.weekday() == 6:
            # Today is Sunday — weekend is yesterday and today
            saturday = today - timedelta(days=1)
            sunday = today
        else:
            # It's a weekday — calculate days until next Saturday
            days_until_saturday = 5 - today.weekday()
            saturday = today + timedelta(days=days_until_saturday)
            sunday = saturday + timedelta(days=1)
        return f"this weekend ({format_date(saturday)} and {format_date(sunday)})"

    elif date_value == 'this week':
        # If today is Sunday we're at the end of the week — just return today
        if today.weekday() == 6:
            return f"this week ({format_date(today)})"
        # Otherwise return from today to the coming Sunday
        days_until_sunday = 6 - today.weekday()
        sunday = today + timedelta(days=days_until_sunday)
        return f"this week ({format_date(today)} to {format_date(sunday)})"

    elif date_value == 'next week':
        # Next week = Monday to Sunday of next week
        days_until_next_monday = (7 - today.weekday()) % 7 or 7
        next_monday = today + timedelta(days=days_until_next_monday)
        next_sunday = next_monday + timedelta(days=6)
        return f"next week ({format_date(next_monday)} to {format_date(next_sunday)})"

    # If we don't recognise the value just return it as is
    return date_value