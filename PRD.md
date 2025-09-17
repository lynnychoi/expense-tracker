# Product Requirements Document (PRD)
# Korean Household Expense Tracker

## 1. Product Overview

### 1.1 Vision
A simple, single-page expense tracking application for Korean households that enables transparent financial management with multi-user collaboration, AI-powered insights, and comprehensive budgeting tools.

### 1.2 Tech Stack
- **Frontend**: Next.js with TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Supabase (Database + Authentication)
- **Deployment**: Vercel
- **AI**: OpenAI API for tag suggestions and insights
- **Currency**: Korean Won (₩)

### 1.3 Target Users
- Korean households (families, roommates, couples)
- Up to 7 members per household
- Users who want transparent, collaborative expense tracking

## 2. Core Requirements

### 2.1 Architecture
- **Single Page Application**: All functionality on one page
- **Multi-user Authentication**: Email/password + Google OAuth
- **Real-time Updates**: Live data synchronization
- **Mobile Responsive**: Equal desktop and mobile experience

### 2.2 Currency & Formatting
- **Currency**: Korean Won (₩) only
- **Precision**: Whole numbers (no decimals)
- **Formatting**: ₩1,234,567 with comma separators

## 3. User Stories (Indexed)

### 3.1 Authentication & Household Management

#### US-001: User Registration & Login
**As a new user, I want to sign up and choose to create or join a household**
- Sign up with email/password or Google OAuth
- Choose "Create New Household" or "Join Existing Household"
- If creating: set household name, get shareable invite link
- If joining: use invite link to join existing household

#### US-002: Household Management
**As a household creator, I want to manage household members**
- View list of all household members with names/avatars
- Generate and share invite links for new members
- Remove members from household (creator only)
- Manage household settings and name

#### US-003: Member Access Control
**As a household member, I want appropriate access to household data**
- View all household financial data when active member
- Lose all access to data when removed from household
- Leave household voluntarily if desired
- Cannot remove other members (only creator can)

### 3.2 Transaction Management

#### US-004: Add Expense Items
**As a user, I want to add expense transactions**
- Required fields: Amount (₩), Date, Person (member name or "Household")
- Optional fields: Description, Tags, Payment Method
- Select from default payment methods or add custom methods
- Attach receipt photos to transactions
- Real-time duplicate detection warnings

#### US-005: Add Income Items
**As a user, I want to add income transactions**
- Required fields: Amount (₩), Date, Person (member name or "Household")
- Optional fields: Description, Tags, Source/Payment Method
- Track who earned the income for household transparency

#### US-006: Transaction Attribution
**As a user, I want to track who earned/spent money**
- Assign each transaction to specific household member
- Option to assign to "Household" for shared expenses/income
- View individual vs household spending patterns
- Track personal accountability within household budget

#### US-007: Edit and Delete Transactions
**As a user, I want to modify existing transactions**
- Edit any transaction with full edit history tracking
- Show "Last edited by [User] on [Date]" for modified entries
- Delete transactions with confirmation dialog
- Track who made what changes for accountability

### 3.3 Recurring Transactions

#### US-008: Create Recurring Items
**As a user, I want to set up recurring transactions**
- Create monthly or yearly recurring expenses/income
- Set amount, description, tags, and person attribution
- Automatic generation of transactions on schedule
- Examples: rent, salary, utilities, subscriptions

#### US-009: Manage Recurring Items
**As a user, I want to control my recurring transactions**
- View list of all active recurring items
- Edit, pause, or end recurring transactions
- Receive notifications 7 days before next recurring item
- Manage future scheduled vs past generated transactions

### 3.4 Data Organization & Display

#### US-010: Transaction Table View
**As a user, I want to see all transactions in an organized table**
- Display all expenses and income in single table
- Columns: Date, Description, Amount, Person, Tags, Payment Method
- Sort by any column (date, amount, person, etc.)
- Search across all fields (amount, description, tags, person, date range)
- Show edit history and attribution information

#### US-011: Tag Management
**As a user, I want to organize transactions with tags**
- Apply multiple tags to each transaction
- Create custom tags or use AI suggestions
- Default Korean household categories: 식비(Food), 교통비(Transportation), 생활용품(Living), 공과금(Utilities), 엔터테인먼트(Entertainment)
- View transactions grouped by tags
- Edit tags on existing transactions

#### US-012: Tag Color Management
**As a user, I want to visually distinguish tags with colors**
- Assign colors to tags from a palette of 24-36 predefined colors
- Change tag colors at any time
- Auto-assign colors to new tags from available palette
- Color consistency across tables, charts, and reports
- Visual color picker interface for easy selection

#### US-013: Payment Method Management
**As a user, I want to track payment methods**
- Default options: Cash, Card, Transfer
- Add custom payment methods (Venmo, PayPal, specific bank cards)
- Assign payment method to each transaction
- Manage personal list of payment methods

### 3.5 Budget Goals & Tracking

#### US-014: Set Budget Goals per Tag
**As a user, I want to set spending limits for each category**
- Create monthly budget goals for each tag/category
- Set amount in Korean Won for each goal
- View progress toward each goal with visual indicators
- Example: Food ₩500,000, Transportation ₩200,000

#### US-015: Budget Progress Monitoring
**As a user, I want to monitor my progress against budget goals**
- Visual indicators: Green (under budget), Yellow (approaching limit), Red (over budget)
- Real-time updates as expenses are added
- Warning notifications when approaching budget limits
- View remaining budget for each category with tag colors

### 3.6 Analytics & Insights

#### US-016: Expense Trend Graphs
**As a user, I want to see visual trends of my spending**
- Line chart showing expense trends over time
- Organize by day, week, or month views
- Filter by categories/tags or view total expenses
- Color-coded lines using tag colors for easy identification
- Export graphs to PDF for reporting

#### US-017: Monthly and Yearly Totals
**As a user, I want to see financial summaries**
- Total expenses for current month and year
- Total income for current month and year
- Net income (income minus expenses) for current month and year
- Calendar month/year basis (Jan 1-31, not rolling periods)

#### US-018: Comparison Views
**As a user, I want to compare financial periods**
- Month-over-month comparisons (this month vs last month)
- Year-over-year comparisons (this year vs last year)
- Show percentage changes and trends
- Visual indicators for increases/decreases

#### US-019: Category Breakdown Analytics
**As a user, I want to understand spending by category**
- Bar charts and pie charts showing spending by tag/category
- Color-coded segments using assigned tag colors
- View expenses and income grouped by tags
- Compare category spending across time periods
- Identify highest spending categories

### 3.7 AI-Powered Features

#### US-020: AI Tag Suggestions
**As a user, I want smart tag recommendations**
- AI suggests appropriate tags based on transaction description
- Learn from general spending patterns (not just household-specific)
- Suggest new tags when adding transactions
- Auto-categorization for common expense types

#### US-021: Real-time Financial Insights
**As a user, I want AI-powered spending insights**
- Real-time insights as transactions are added
- Examples: "You spent 20% more on food this month"
- Spending pattern analysis and recommendations
- Unusual spending detection and alerts

### 3.8 Export & Reporting

#### US-022: Data Export
**As a user, I want to export my financial data**
- Export transaction data to CSV format
- Include all transaction details and metadata
- Filter export by date range, categories, or members

#### US-023: PDF Report Generation
**As a user, I want professional financial reports**
- Generate PDF reports with graphs and charts
- Include monthly/yearly summaries and comparisons
- Color-coded charts using tag colors
- Print-friendly format for record keeping
- Share reports with household members or external parties

### 3.9 User Experience Features

#### US-024: Quick Entry Shortcuts
**As a user, I want fast transaction entry**
- Quick entry buttons for common expenses (coffee, lunch, gas)
- Pre-filled templates for frequent transactions
- Streamlined mobile entry experience

#### US-025: Notification System
**As a user, I want timely financial alerts**
- Banner notifications for recurring items due in 7 days
- Budget warning alerts when approaching spending limits
- Real-time duplicate transaction warnings
- Clear, non-intrusive notification display

#### US-026: Search and Filter
**As a user, I want to find specific transactions quickly**
- Global search across all transaction fields
- Filter by date ranges, amounts, people, tags, payment methods
- Advanced search combinations with color-coded tag filters
- Save frequently used search filters

### 3.10 Data Management

#### US-027: Duplicate Detection
**As a user, I want to avoid duplicate entries**
- Automatic detection of potential duplicate transactions
- Warning prompts before saving likely duplicates
- Smart matching based on amount, date, and description

#### US-028: Data Retention and Access
**As a user, I want my financial data to be preserved**
- Unlimited transaction history storage
- Data remains when members leave household
- Removed members cannot access any household data
- Household data cannot be permanently deleted (soft delete only)

### 3.11 Onboarding Experience

#### US-029: First-Time User Setup
**As a new user, I want smooth onboarding**
- Choose between creating or joining household after signup
- Brief tutorial on adding first transaction
- Pre-populated sample data to demonstrate features
- Default Korean household tags with pre-assigned colors

#### US-030: User Profile Management
**As a user, I want to manage my profile**
- Set name and avatar for household identification
- Manage personal settings and preferences
- View personal spending/earning statistics

## 4. Technical Specifications

### 4.1 Database Schema (Supabase)

#### Users Table
- id (UUID, primary key)
- email (string, unique)
- name (string)
- avatar_url (string, optional)
- created_at (timestamp)
- updated_at (timestamp)

#### Households Table
- id (UUID, primary key)
- name (string)
- created_by (UUID, foreign key to Users)
- invite_code (string, unique)
- created_at (timestamp)
- updated_at (timestamp)
- deleted_at (timestamp, nullable for soft delete)

#### Household_Members Table
- id (UUID, primary key)
- household_id (UUID, foreign key to Households)
- user_id (UUID, foreign key to Users)
- joined_at (timestamp)
- removed_at (timestamp, nullable)

#### Transactions Table
- id (UUID, primary key)
- household_id (UUID, foreign key to Households)
- type (enum: 'expense', 'income')
- amount (bigint, Korean Won without decimals)
- description (text, optional)
- date (date)
- person_type (enum: 'member', 'household')
- person_id (UUID, foreign key to Users, nullable if household)
- payment_method (string)
- receipt_url (string, optional)
- created_by (UUID, foreign key to Users)
- updated_by (UUID, foreign key to Users)
- created_at (timestamp)
- updated_at (timestamp)

#### Transaction_Tags Table
- id (UUID, primary key)
- transaction_id (UUID, foreign key to Transactions)
- tag_name (string)
- created_at (timestamp)

#### Tag_Colors Table
- id (UUID, primary key)
- household_id (UUID, foreign key to Households)
- tag_name (string)
- color_hex (string, 6-digit hex color)
- created_at (timestamp)
- updated_at (timestamp)

#### Recurring_Transactions Table
- id (UUID, primary key)
- household_id (UUID, foreign key to Households)
- type (enum: 'expense', 'income')
- amount (bigint)
- description (text, optional)
- frequency (enum: 'monthly', 'yearly')
- person_type (enum: 'member', 'household')
- person_id (UUID, foreign key to Users, nullable)
- payment_method (string)
- next_date (date)
- is_active (boolean)
- created_by (UUID, foreign key to Users)
- created_at (timestamp)
- updated_at (timestamp)

#### Budget_Goals Table
- id (UUID, primary key)
- household_id (UUID, foreign key to Households)
- tag_name (string)
- monthly_limit (bigint, Korean Won)
- created_by (UUID, foreign key to Users)
- created_at (timestamp)
- updated_at (timestamp)

### 4.2 Color Palette Specification

#### Predefined Color Palette (30 Colors)
```
Primary Colors (6):
#FF6B6B (Red), #4ECDC4 (Teal), #45B7D1 (Blue), 
#96CEB4 (Green), #FECA57 (Yellow), #FF9FF3 (Pink)

Secondary Colors (12):
#6C5CE7 (Purple), #A29BFE (Light Purple), #FD79A8 (Rose),
#E17055 (Orange), #00B894 (Emerald), #00CEC9 (Cyan),
#74B9FF (Sky Blue), #FDCB6E (Amber), #E84393 (Magenta),
#6C5CE7 (Violet), #00B894 (Mint), #FF7675 (Coral)

Tertiary Colors (12):
#DDA0DD (Plum), #98D8C8 (Seafoam), #F7DC6F (Cream),
#BB8FCE (Lavender), #85C1E9 (Periwinkle), #F8C471 (Peach),
#82E0AA (Sage), #F1948A (Salmon), #AED6F1 (Powder Blue),
#D7BDE2 (Thistle), #A3E4D7 (Aqua), #FAD7A0 (Champagne)
```

### 4.3 API Endpoints

#### Authentication
- POST /auth/signup
- POST /auth/login
- POST /auth/logout
- GET /auth/user

#### Households
- POST /api/households (create)
- GET /api/households/:id (get details)
- PUT /api/households/:id (update)
- POST /api/households/:id/invite (generate invite)
- POST /api/households/join/:invite_code (join household)
- DELETE /api/households/:id/members/:user_id (remove member)

#### Transactions
- GET /api/households/:id/transactions (list with filters)
- POST /api/households/:id/transactions (create)
- PUT /api/transactions/:id (update)
- DELETE /api/transactions/:id (delete)
- GET /api/transactions/:id/history (edit history)

#### Tag Colors
- GET /api/households/:id/tag-colors (list all tag colors)
- PUT /api/households/:id/tag-colors/:tag (update tag color)
- POST /api/households/:id/tag-colors (assign color to new tag)

#### Recurring Transactions
- GET /api/households/:id/recurring (list)
- POST /api/households/:id/recurring (create)
- PUT /api/recurring/:id (update)
- DELETE /api/recurring/:id (delete)

#### Budget Goals
- GET /api/households/:id/goals (list)
- POST /api/households/:id/goals (create)
- PUT /api/goals/:id (update)
- DELETE /api/goals/:id (delete)

#### Analytics
- GET /api/households/:id/analytics/trends
- GET /api/households/:id/analytics/totals
- GET /api/households/:id/analytics/categories

#### Export
- GET /api/households/:id/export/csv
- POST /api/households/:id/export/pdf

#### AI Features
- POST /api/ai/suggest-tags
- POST /api/ai/insights

### 4.4 Frontend Components (Shadcn/UI)

#### Layout Components
- DashboardLayout
- Header with household switcher
- Navigation sidebar
- Mobile responsive design

#### Transaction Components
- TransactionForm (add/edit)
- TransactionTable (with sorting, filtering, color-coded tags)
- QuickEntryButtons
- RecurringTransactionManager

#### Tag Management Components
- TagSelector with color indicators
- ColorPicker for tag color assignment
- TagColorManager (view/edit all tag colors)
- TagFilter with color-coded options

#### Analytics Components
- TrendChart (line chart with color-coded categories)
- CategoryChart (bar/pie chart with tag colors)
- BudgetProgress (color-coded visual goal tracking)
- ComparisonView (period-over-period with colors)

#### UI Components
- PersonSelector (members + household)
- PaymentMethodSelector
- DateRangePicker
- SearchBar with color-coded tag filters

### 4.5 External Integrations

#### OpenAI API
- Tag suggestion endpoint
- Financial insights generation
- Natural language processing for descriptions

#### Supabase Features
- Real-time subscriptions for live updates
- Row Level Security (RLS) for data access control
- Storage for receipt images
- Auth with social providers

### 4.6 Performance Requirements
- Page load time < 3 seconds
- Real-time updates < 1 second delay
- Support up to 7 concurrent users per household
- Handle 10,000+ transactions per household
- Mobile-first responsive design

### 4.7 Security Requirements
- Row Level Security for all database access
- Secure invite link generation with expiration
- Receipt image storage with access controls
- HTTPS-only communication
- Input validation and sanitization

## 5. Success Metrics

### 5.1 User Engagement
- Daily active users per household
- Transaction entry frequency
- Feature adoption rates (goals, recurring items, AI suggestions, color customization)

### 5.2 Functionality Success
- Budget goal adherence rates
- AI tag suggestion accuracy
- Export feature usage
- Mobile vs desktop usage patterns
- Tag color customization usage

### 5.3 Technical Performance
- Page load speed metrics
- Real-time update latency
- Error rates and bug reports
- User retention rates

## 6. Future Enhancements (Post-MVP)

### 6.1 Advanced Features
- Receipt OCR for automatic data entry
- Bank account integration for automatic imports
- Investment tracking capabilities
- Debt and loan management

### 6.2 Enhanced Analytics
- Predictive spending forecasts
- Personalized financial recommendations
- Advanced reporting and dashboards
- Financial goal planning tools

### 6.3 Collaboration Features
- In-app messaging and comments
- Approval workflows for large expenses
- Shared shopping lists with budget tracking
- Family financial education resources

### 6.4 Enhanced Customization
- Custom color themes for entire interface
- Tag hierarchies with parent-child relationships
- Advanced filtering and sorting options
- Personalized dashboard layouts

---

## Appendix: Default Korean Household Tags with Colors

### Expense Categories
- 식비 (Food/Dining) - #FF6B6B (Red)
- 교통비 (Transportation) - #45B7D1 (Blue)
- 생활용품 (Living Supplies) - #96CEB4 (Green)
- 공과금 (Utilities) - #FECA57 (Yellow)
- 엔터테인먼트 (Entertainment) - #FF9FF3 (Pink)
- 의료비 (Medical) - #4ECDC4 (Teal)
- 교육비 (Education) - #6C5CE7 (Purple)
- 의류 (Clothing) - #A29BFE (Light Purple)
- 주거비 (Housing) - #E17055 (Orange)
- 보험료 (Insurance) - #74B9FF (Sky Blue)

### Income Categories  
- 급여 (Salary) - #00B894 (Emerald)
- 부업 (Side Income) - #FDCB6E (Amber)
- 투자수익 (Investment Returns) - #00CEC9 (Cyan)
- 정부지원금 (Government Support) - #E84393 (Magenta)
- 기타수입 (Other Income) - #98D8C8 (Seafoam)

---

*This PRD serves as the comprehensive specification for development and can be used to track progress through indexed user stories.*