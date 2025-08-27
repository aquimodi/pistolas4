# Datacenter Equipment Management System - User Manual

## Overview

The Datacenter Equipment Management System is a comprehensive solution for tracking and managing IT equipment reception in datacenter environments. The system follows a strict hierarchical structure: **Project → Order → Delivery Note → Equipment**.

## Getting Started

### Logging In

1. Open your web browser and navigate to the application URL
2. Enter your username and password
3. Click "Sign In"

**Default Demo Credentials:**
- Administrator: `admin` / `admin`
- Operator: `operator` / `operator`

### User Roles

- **Admin**: Full system access, can manage users and all data
- **Manager**: Can manage projects, orders, and equipment
- **Operator**: Can view and edit equipment data
- **Viewer**: Read-only access to all data

## Using the System

### Dashboard

The dashboard provides an overview of your datacenter equipment management:

- **System Statistics**: Quick view of projects, orders, equipment counts
- **Performance Metrics**: Real-time system performance data
- **Recent Activity**: Latest system activities and changes
- **Quick Actions**: Direct access to common tasks

### Managing Projects

Projects are the top-level containers for equipment management activities.

#### Creating a Project
1. Navigate to **Projects** from the sidebar
2. Click **New Project**
3. Fill in the project details:
   - **Name**: Descriptive project name
   - **Description**: Detailed project description
   - **Status**: Active, On Hold, Completed, or Cancelled
4. Click **Create Project**

#### Viewing Projects
- All projects are displayed as cards showing key information
- Click **View Orders** to see orders within a project
- Use **Edit** to modify project details (Admin/Manager only)

### Managing Orders

Orders represent equipment purchase orders within a project.

#### Creating an Order
1. From a project page, click **New Order**
2. Fill in the order details:
   - **Order Number**: Unique identifier (e.g., ORD-2024-001)
   - **Vendor**: Equipment supplier name
   - **Description**: Order details and specifications
   - **Expected Delivery Date**: When equipment is expected
   - **Status**: Pending, Received, Partial, or Cancelled
3. Click **Create Order**

#### Managing Orders
- View all orders for a project
- Track delivery status and vendor information
- Click **Delivery Notes** to manage deliveries for an order

### Managing Delivery Notes

Delivery Notes track individual shipments for orders.

#### Recording a Delivery
1. From an order page, navigate to delivery notes
2. Delivery notes are typically created automatically when shipments arrive
3. Each delivery note contains:
   - **Delivery Note Number**: Supplier's delivery reference
   - **Delivery Date**: When items were received
   - **Carrier**: Shipping company
   - **Tracking Number**: Shipment tracking reference
   - **Status**: Received, Processing, or Completed

#### Viewing Deliveries
- Review all delivery notes for an order
- Track carrier and delivery date information
- Click **Equipment** to manage individual items in a delivery

### Managing Equipment

Equipment represents individual IT items received in deliveries.

#### Adding Equipment
Equipment is typically added when processing delivery notes:

1. Navigate to a delivery note's equipment page
2. Each equipment item includes:
   - **Serial Number**: Manufacturer's serial number
   - **Asset Tag**: Internal asset tracking number
   - **Manufacturer**: Equipment manufacturer (Dell, HPE, Cisco, etc.)
   - **Model**: Specific model number
   - **Category**: Server, Network, Storage, etc.
   - **Specifications**: Detailed technical specifications
   - **Condition**: New, Good, Fair, or Poor
   - **Location**: Physical datacenter location
   - **Status**: Received, Installed, Configured, or Decommissioned

#### Equipment Status Workflow
1. **Received**: Equipment has arrived and been logged
2. **Installed**: Equipment has been physically installed
3. **Configured**: Equipment is configured and ready for use
4. **Decommissioned**: Equipment has been retired

### System Monitoring

The monitoring section provides real-time system insights (Admin access required):

#### System Status
- Server uptime and performance
- Memory usage and system health
- Database connection status
- Node.js version information

#### Performance Metrics
- API requests per minute
- Average response times
- Error rates
- Active user count
- Database connection pool status

#### Application Logs
- Real-time application event logs
- Error tracking and debugging information
- User activity monitoring
- System performance alerts

## Navigation Tips

### Breadcrumb Navigation
- Use the breadcrumb navigation at the top of each page to understand your current location
- Click any breadcrumb item to navigate back to that level

### Hierarchical Navigation
- Follow the strict hierarchy: Projects → Orders → Delivery Notes → Equipment
- Each level provides access to the next level in the hierarchy
- Use the sidebar for quick access to main sections

### Search and Filtering
- Use browser search (Ctrl+F) to find specific items on any page
- Equipment pages show detailed specifications for easy identification

## Best Practices

### Data Entry
- Always use consistent naming conventions
- Include detailed descriptions for better tracking
- Keep asset tags and serial numbers accurate
- Update equipment status as it moves through the workflow

### Equipment Tracking
- Record equipment location changes promptly
- Update status when equipment is installed or configured
- Include detailed specifications for future reference
- Use consistent location naming (Rack designation, room, etc.)

### Security
- Log out when finished using the system
- Don't share login credentials
- Report any suspicious activity to administrators

## Common Tasks

### Receiving New Equipment
1. Navigate to the relevant project
2. Find or create the appropriate order
3. Create or locate the delivery note
4. Add individual equipment items with all details

### Moving Equipment
1. Find the equipment item
2. Update the location field
3. Change status if appropriate (e.g., from Received to Installed)

### Equipment Lifecycle Management
1. Start with "Received" status when equipment arrives
2. Update to "Installed" when physically deployed
3. Change to "Configured" when ready for use
4. Mark as "Decommissioned" when retired

## Reporting and Monitoring

### Dashboard Metrics
- Monitor overall system statistics
- Track pending deliveries and equipment counts
- Review recent activity for anomalies

### Audit Trail
- All user actions are logged automatically
- Administrators can review activity logs
- Changes to equipment status are tracked

## Support and Troubleshooting

### Common Issues

**Cannot Log In**:
- Verify username and password are correct
- Contact administrator to verify account status

**Data Not Loading**:
- Check internet connection
- Refresh the page
- Contact IT support if issues persist

**Permission Denied**:
- Verify you have appropriate role permissions
- Contact administrator for role adjustments

### Getting Help
- Contact your system administrator for technical issues
- Refer to this manual for operational procedures
- Use the system monitoring page to check system status

---

*For technical support, contact your IT department or system administrator.*