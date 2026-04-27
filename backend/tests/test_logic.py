from marathon_model.logic import calculate_lt_percent, calculate_speed_raw, format_time

def test_calculate_lt_percent():
    # 2.0 mmol/L should be 85%
    assert calculate_lt_percent(2.0) == 85.0
    # 3.0 mmol/L should be 75%
    assert calculate_lt_percent(3.0) == 75.0
    # 1.5 mmol/L should be 90%
    assert calculate_lt_percent(1.5) == 90.0
    # Boundary checks (min/max clamps)
    assert calculate_lt_percent(1.0) == 95.0 # clamped to max
    assert calculate_lt_percent(5.0) == 60.0 # clamped to min

def test_calculate_speed_raw():
    # Test interpolation at 50% (Avg economy)
    # High: VO2 * 0.2936 + 2.6481
    # Low:  VO2 * 0.2779 + 1.2499
    # VO2 = 60
    # High: 17.616 + 2.6481 = 20.2641
    # Low:  16.674 + 1.2499 = 17.9239
    # 50% should be ~19.094
    speed = calculate_speed_raw(60.0, 0.5)
    assert 19.0 <= speed <= 19.2

def test_format_time():
    assert format_time(21.1) == "1:59:59" # Roughly 2 hours
    assert format_time(10.0) == "4:13:10"
