import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_security_report_pdf(report_data: dict) -> bytes:
    """Generate professional CYVANTIS PDF Threat Intelligence & Security Report"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0B132B')
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4A5568')
    )

    heading_style = ParagraphStyle(
        'HeadingStyle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1C2541'),
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#2D3748')
    )

    elements = []

    # Header section
    elements.append(Paragraph("CYVANTIS Enterprise Threat Intelligence Report", title_style))
    elements.append(Paragraph(f"Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Platform: AEGISNEX v1.0", subtitle_style))
    elements.append(Spacer(1, 15))

    # Executive Summary
    elements.append(Paragraph("1. Executive Summary", heading_style))
    exec_text = (
        f"During the reporting period, CYVANTIS honeypot sensors recorded a total of <b>{report_data.get('total_events', 0)}</b> "
        f"cyberattack events across <b>{report_data.get('unique_ips', 0)}</b> unique source IP addresses. "
        f"Primary targeted services include SSH ({report_data.get('ssh_attempts', 0)} attempts) and Telnet ({report_data.get('telnet_attempts', 0)} attempts). "
        f"A total of <b>{report_data.get('critical_alerts', 0)}</b> critical security alerts and <b>{report_data.get('active_investigations', 0)}</b> "
        "active incident investigations were tracked."
    )
    elements.append(Paragraph(exec_text, body_style))
    elements.append(Spacer(1, 15))

    # KPI Breakdown Table
    elements.append(Paragraph("2. Operational KPI Metrics", heading_style))
    kpi_data = [
        ["Metric Name", "Value", "Metric Name", "Value"],
        ["Total Recorded Events", str(report_data.get('total_events', 0)), "Unique Threat Source IPs", str(report_data.get('unique_ips', 0))],
        ["SSH Attack Attempts", str(report_data.get('ssh_attempts', 0)), "Telnet Attack Attempts", str(report_data.get('telnet_attempts', 0))],
        ["Auth Bruteforce Attempts", str(report_data.get('auth_attempts', 0)), "Active Investigations", str(report_data.get('active_investigations', 0))],
        ["Critical Security Alerts", str(report_data.get('critical_alerts', 0)), "Active Honeypot Sensors", str(report_data.get('active_sensors', 1))],
    ]

    t = Table(kpi_data, colWidths=[160, 100, 160, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1C2541')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E0')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F7FAFC')),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 15))

    # Top Targeted Credentials
    elements.append(Paragraph("3. Top Targeted Usernames & Passwords", heading_style))
    cred_headers = ["Top Usernames", "Count", "Top Passwords", "Count"]
    top_users = report_data.get('top_usernames', [])
    top_pass = report_data.get('top_passwords', [])
    
    cred_rows = [cred_headers]
    max_len = max(len(top_users), len(top_pass), 5)
    for i in range(min(max_len, 5)):
        u_name = top_users[i]['username'] if i < len(top_users) else "-"
        u_cnt = str(top_users[i]['count']) if i < len(top_users) else "-"
        p_name = top_pass[i]['password'] if i < len(top_pass) else "-"
        p_cnt = str(top_pass[i]['count']) if i < len(top_pass) else "-"
        cred_rows.append([u_name, u_cnt, p_name, p_cnt])

    tc = Table(cred_rows, colWidths=[160, 100, 160, 100])
    tc.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0B132B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    elements.append(tc)
    elements.append(Spacer(1, 15))

    # Analytical Recommendations
    elements.append(Paragraph("4. Defensive Recommendations", heading_style))
    recs = (
        "• Enforce strong, multi-factor authentication (MFA) across all administrative SSH gateways.<br/>"
        "• Block identified high-frequency malicious source IPs at edge firewalls.<br/>"
        "• Disable Telnet protocol and unencrypted management services platform-wide.<br/>"
        "• Continuously update IOC blocklists based on honeypot payload extraction signatures."
    )
    elements.append(Paragraph(recs, body_style))

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
