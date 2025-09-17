# Database Setup for Korean Household Expense Tracker

## Prerequisites

To run the database locally, you need:
- Docker Desktop installed and running
- Supabase CLI (already installed via Homebrew)

## Database Schema

The database schema is defined in the following migration files:

### 1. Initial Schema (`supabase/migrations/20250916000001_initial_schema.sql`)
- **Users table**: User profiles linked to Supabase auth
- **Households table**: Household information with invite codes
- **Household_members table**: Many-to-many relationship between users and households
- **Transactions table**: Financial transactions with Korean Won amounts (stored as BIGINT)
- **Transaction_tags table**: Many-to-many relationship for transaction tags
- **Tag_colors table**: Color assignments for tags (30-color palette)
- **Recurring_transactions table**: Monthly/yearly recurring transactions
- **Budget_goals table**: Per-tag monthly budget limits
- **Row Level Security (RLS)**: Complete security policies for multi-household isolation

### 2. Seed Data (`supabase/migrations/20250916000002_seed_data.sql`)
- Helper functions for creating default Korean household tags
- Sample data generation for new households
- Default Korean categories with assigned colors

## Korean Won Configuration

- All amounts stored as `BIGINT` (integers) for Korean Won
- No decimal places - Korean Won doesn't use subunits
- Use utility functions in `src/lib/currency.ts` for formatting
- Example: 1234567 (stored) → "₩1,234,567" (displayed)

## Default Korean Tags

### Expense Categories
- 식비 (Food/Dining) - #FF6B6B
- 교통비 (Transportation) - #45B7D1
- 생활용품 (Living Supplies) - #96CEB4
- 공과금 (Utilities) - #FECA57
- 엔터테인먼트 (Entertainment) - #FF9FF3
- 의료비 (Medical) - #4ECDC4
- 교육비 (Education) - #6C5CE7
- 의류 (Clothing) - #A29BFE
- 주거비 (Housing) - #E17055
- 보험료 (Insurance) - #74B9FF

### Income Categories
- 급여 (Salary) - #00B894
- 부업 (Side Income) - #FDCB6E
- 투자수익 (Investment Returns) - #00CEC9
- 정부지원금 (Government Support) - #E84393
- 기타수입 (Other Income) - #98D8C8

## Local Development Setup

1. **Install Docker Desktop**: Download from [docker.com](https://www.docker.com/products/docker-desktop/)

2. **Start Supabase locally**:
   ```bash
   supabase start
   ```

3. **Apply migrations**:
   ```bash
   supabase db reset
   ```

4. **View local dashboard**:
   ```bash
   supabase status
   ```

## Production Deployment

1. **Create Supabase project** at [supabase.com](https://supabase.com)

2. **Link to project**:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

3. **Push migrations**:
   ```bash
   supabase db push
   ```

4. **Update environment variables**:
   ```bash
   # Copy from Supabase dashboard -> Settings -> API
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Usage Functions

After deployment, use these functions for new households:

```sql
-- Create default tags for a new household
SELECT create_default_tags_for_household('household-uuid-here');

-- Create sample data for testing
SELECT create_sample_data_for_household('household-uuid-here', 'user-uuid-here');
```

## Security Features

- **Row Level Security**: Users can only access their household's data
- **Household Isolation**: Complete data separation between households
- **Creator Privileges**: Only household creators can manage members
- **Soft Deletes**: Households appear deleted but data is retained
- **Audit Trail**: Track who created/updated each transaction

## Performance Optimizations

- **Indexes**: Optimized for common query patterns
- **Partitioning**: Ready for large transaction volumes
- **Composite Keys**: Efficient joins and lookups
- **Updated Triggers**: Automatic timestamp management