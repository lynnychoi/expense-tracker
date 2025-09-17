-- Create function to generate default Korean tags for a household
CREATE OR REPLACE FUNCTION create_default_tags_for_household(household_uuid UUID)
RETURNS void AS $$
DECLARE
    default_tags RECORD;
BEGIN
    -- Define default Korean household tags with colors
    FOR default_tags IN
        SELECT * FROM (VALUES
            ('식비', '#FF6B6B'),           -- Food - Red
            ('교통비', '#4ECDC4'),         -- Transportation - Teal  
            ('의료비', '#45B7D1'),         -- Medical - Blue
            ('생활용품', '#96CEB4'),       -- Household items - Green
            ('통신비', '#FECA57'),         -- Communication - Yellow
            ('문화생활', '#FF9FF3'),       -- Culture/Entertainment - Pink
            ('교육비', '#54A0FF'),         -- Education - Light Blue
            ('주거비', '#5F27CD'),         -- Housing - Purple
            ('의류', '#00D2D3'),           -- Clothing - Cyan
            ('경조사비', '#FF9F43'),       -- Ceremonies - Orange
            ('저축', '#2ED573'),           -- Savings - Green
            ('용돈', '#A4B0BE'),           -- Allowance - Gray
            ('기타', '#6C5CE7')            -- Others - Violet
        ) AS t(tag_name, color_hex)
    LOOP
        -- Insert tag color for the household
        INSERT INTO tag_colors (household_id, tag_name, color_hex)
        VALUES (household_uuid, default_tags.tag_name, default_tags.color_hex)
        ON CONFLICT (household_id, tag_name) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;