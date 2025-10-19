# Data Export Feature Implementation
## GDPR Data Portability Compliance

**Implementation Date**: October 3, 2025
**Status**: ✅ Complete
**GDPR Article**: Article 20 (Right to Data Portability)

---

## Overview

This document describes the implementation of the data export feature for ShelfQuest, enabling users to download all their personal data in a machine-readable format as required by GDPR.

---

## Components Implemented

### Backend API

**File**: `server2/src/routes/dataExport.js`

#### Endpoints

1. **GET /api/data-export/user-data**
   - Exports all user data in JSON format
   - Includes: account, books, notes, reading progress, sessions, gamification data, statistics
   - Sets proper headers for file download
   - Filename format: `shelfquest-data-export-{userId}-{timestamp}.json`

2. **GET /api/data-export/summary**
   - Returns summary counts of exportable data
   - Used to display data overview in UI before export

#### Data Included in Export

The export includes the following categories:

| Category | Data Points |
|----------|-------------|
| **Account** | Email, name, account creation date, last update |
| **Library** | Books with metadata (title, author, ISBN, etc.) |
| **Reading Progress** | Current page, progress %, last read date, time spent |
| **Notes & Highlights** | Content, type, page, position, color, tags |
| **Reading Sessions** | Start/end time, duration, pages read |
| **Gamification** | Points, level, streak, achievements unlocked |
| **Achievements** | Achievement details and unlock dates |
| **Reading Goals** | Goal type, target, current progress, status |
| **Daily Statistics** | 365 days of reading stats (pages, time, notes) |

**Note**: Book files (PDF/EPUB) are NOT included in the export due to size. Users can download them separately from the app.

---

### Frontend Component

**Files**:
- `client2/src/components/DataExport.jsx`
- `client2/src/components/DataExport.css`

#### Features

- **Data Summary**: Shows counts of books, notes, sessions, achievements, statistics
- **One-Click Export**: Downloads JSON file with all user data
- **Loading States**: Clear feedback during data preparation
- **Error Handling**: User-friendly error messages
- **Material Design 3**: Fully styled with MD3 tokens for theme consistency
- **Accessibility**: Keyboard navigation, screen reader support, high contrast mode
- **Responsive**: Works on mobile, tablet, and desktop

---

## Integration Instructions

### 1. Add Route to Server (Already Done)

The data export route has been added to `server2/src/server.js`:

```javascript
import dataExportRouter from './routes/dataExport.js';
// ...
app.use('/api/data-export', dataExportRouter);
```

### 2. Add Component to Settings/Profile Page

To integrate the data export component into your app, add it to a settings or profile page:

```jsx
import DataExport from '../components/DataExport';

function SettingsPage() {
  return (
    <div className="settings-page">
      {/* Other settings sections */}

      <section className="settings-section">
        <h2>Privacy & Data</h2>
        <DataExport />
      </section>
    </div>
  );
}
```

### 3. Add to Navigation (Optional)

Add a link to the data export page in your app's navigation or settings menu:

```jsx
<Link to="/settings/data-export">
  <span className="icon">📦</span>
  Export My Data
</Link>
```

---

## Usage

### For Users

1. Navigate to Settings → Privacy & Data → Export My Data
2. Review the summary of data to be exported
3. Click "Export My Data" button
4. JSON file downloads automatically with filename `shelfquest-data-export-{userId}-{timestamp}.json`
5. Open file in any text editor or JSON viewer

### For Developers

**Test the API endpoint**:
```bash
# Get export summary
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/data-export/summary

# Download full export
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/data-export/user-data \
  --output my-data.json
```

---

## Security & Privacy

### Authentication Required

- Both endpoints require valid JWT authentication
- Users can only export their own data (verified by `req.user.id`)

### Data Handling

- No data is logged or stored during export process
- Export is generated on-demand (not cached)
- Sensitive data (passwords) are never included in export
- File downloads use secure headers (Content-Disposition, Content-Type)

### Rate Limiting

Consider adding rate limiting to prevent abuse:

```javascript
// In server.js
app.use('/api/data-export', rateLimitSuite.general, dataExportRouter);
```

---

## Compliance Details

### GDPR Article 20 - Right to Data Portability

✅ **Requirement Met**: "The data subject shall have the right to receive the personal data concerning him or her in a structured, commonly used and machine-readable format"

**How we comply**:
- **Structured**: Data organized into clear categories (account, library, notes, etc.)
- **Commonly used**: JSON format (industry standard)
- **Machine-readable**: Valid JSON that can be parsed programmatically

### GDPR Article 15 - Right of Access

✅ **Requirement Met**: "The data subject shall have the right to obtain from the controller confirmation as to whether or not personal data concerning him or her are being processed"

**How we comply**:
- Export includes all personal data processed by ShelfQuest
- Clear labeling of data categories
- Transparent disclosure of what data is collected

---

## Testing Checklist

- [ ] Test export with account that has:
  - [x] Multiple books
  - [x] Notes and highlights
  - [ ] Reading progress on various books
  - [ ] Reading sessions
  - [ ] Achievements unlocked
  - [ ] Reading goals (active and completed)
  - [ ] Daily statistics
- [ ] Verify JSON file structure is valid
- [ ] Test download on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Verify authentication is required
- [ ] Test with empty account (no books)
- [ ] Verify no other user's data is included
- [ ] Test summary endpoint accuracy
- [ ] Verify error handling (network errors, server errors)

---

## Future Enhancements

### Potential Improvements

1. **Multiple Export Formats**
   - CSV format for spreadsheet import
   - XML format for legacy systems
   - PDF format for human-readable report

2. **Selective Export**
   - Allow users to choose which categories to export
   - Date range filtering (e.g., "Export last year's data")

3. **Scheduled Exports**
   - Automatic monthly/yearly exports sent via email
   - Export history with links to previous downloads

4. **Export Encryption**
   - Option to encrypt export file with user-provided password
   - Useful for sensitive notes/highlights

5. **Data Import**
   - Allow users to re-import their data to another ShelfQuest account
   - Data portability to other reading apps (if API compatible)

---

## Troubleshooting

### Common Issues

**Issue**: Export button does nothing
**Solution**: Check browser console for errors. Verify API endpoint is accessible.

**Issue**: Download fails with 401 Unauthorized
**Solution**: User's auth token may have expired. Log out and log back in.

**Issue**: JSON file is empty or malformed
**Solution**: Check server logs for database query errors. Verify Supabase connection.

**Issue**: Summary shows 0 for all counts
**Solution**: Verify RLS policies allow user to read their own data. Check user_id in database.

### Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Re-authenticate user |
| 404 | User not found | Verify user exists in database |
| 500 | Server error | Check server logs, verify database connection |

---

## Maintenance

### Regular Tasks

- **Monthly**: Test export feature to ensure it's working
- **After major updates**: Verify new data types are included in export
- **When adding features**: Update export endpoint to include new data tables
- **Annually**: Review export format version and consider updates

### Schema Changes

When adding new tables or fields:

1. Update `dataExport.js` to query new data
2. Add new section to `exportData` object
3. Update this documentation
4. Update frontend summary display (if applicable)
5. Increment format_version in export (e.g., 1.0 → 1.1)

---

## Documentation References

- [GDPR Article 15 - Right of Access](https://gdpr-info.eu/art-15-gdpr/)
- [GDPR Article 20 - Right to Data Portability](https://gdpr-info.eu/art-20-gdpr/)
- [Data Protection Impact Assessment](./data-protection-impact-assessment.md)
- [Privacy Policy](./privacy-policy.md)

---

## Contact

**For technical issues**:
- Development Team

**For privacy questions**:
- Email: info@shelfquest.pro
- Data Protection Officer: info@shelfquest.pro

---

*This implementation was completed on October 3, 2025 as part of ShelfQuest's GDPR compliance initiative.*
