// Filename: src/app/api/contact-alerts/route.ts

import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env['RESEND_API_KEY'] as string);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Compile the extra details using your elegant dark theme styling
    let extraDetailsHTML = "";

    if (body.tier === 'gifting') {
      extraDetailsHTML += "<h3 style=\"color: #c8b99a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #3f3f46; padding-bottom: 8px; margin-top: 24px;\">Gifting Requirements</h3>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Spirulina (Qty):</strong> " + (body.giftingProducts?.spirulina ? body.spirulinaQty : "0") + "</p>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Moringa (Qty):</strong> " + (body.giftingProducts?.moringa ? body.moringaQty : "0") + "</p>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Delivery Date:</strong> " + (body.deliveryDate || "Not specified") + "</p>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Delivery Time:</strong> " + (body.deliveryTime || "Not specified") + "</p>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Location/Venue:</strong> " + (body.deliveryLocation || "Not specified") + "</p>";
    } 
    else if (body.tier === 'collab' || body.tier === 'press') {
      extraDetailsHTML += "<h3 style=\"color: #c8b99a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #3f3f46; padding-bottom: 8px; margin-top: 24px;\">Partnership Details</h3>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Social / Portfolio:</strong> " + (body.socialHandle || "Not specified") + "</p>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Products Requested:</strong> " + (body.collabProducts || "Not specified") + "</p>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Event Date:</strong> " + (body.eventDate || "Not specified") + "</p>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Event Time:</strong> " + (body.eventTime || "Not specified") + "</p>";
    } 
    else if (body.tier === 'careers') {
      extraDetailsHTML += "<h3 style=\"color: #c8b99a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #3f3f46; padding-bottom: 8px; margin-top: 24px;\">Candidate Profile</h3>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Position:</strong> " + (body.position || "Not specified") + "</p>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Expected Compensation:</strong> " + (body.expectedSalary || "Not specified") + "</p>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Qualifications:</strong> " + (body.qualifications || "Not specified") + "</p>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Tentative Start:</strong> " + (body.tentativeJoiningDate || "Not specified") + "</p>";
    } 
    else if (body.tier === 'feedback') {
      extraDetailsHTML += "<h3 style=\"color: #c8b99a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #3f3f46; padding-bottom: 8px; margin-top: 24px;\">Feedback Context</h3>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Purchased Platform:</strong> " + (body.purchasePlatform || "Not specified") + "</p>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Purchase Date:</strong> " + (body.purchaseDate || "Not specified") + "</p>";
    }
    else if (body.tier === 'buy') {
      extraDetailsHTML += "<h3 style=\"color: #c8b99a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #3f3f46; padding-bottom: 8px; margin-top: 24px;\">Product Selection</h3>";
      extraDetailsHTML += "<p style=\"color: #a8a29e; font-size: 14px; margin: 4px 0;\"><strong style=\"color: #ffffff;\">Product:</strong> " + (body.product || "Not specified") + "</p>";
    }

    // 2. Admin Alert Email (Combining your design with the new data)
    const adminHtml = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #1a1a1a; color: #ffffff; text-align: center;\">" +
      "<p style=\"font-size: 10px; letter-spacing: 0.3em; color: #c8b99a; text-transform: uppercase; margin-bottom: 20px;\">System Alert</p>" +
      "<h1 style=\"font-size: 24px; font-weight: normal; margin-bottom: 30px; letter-spacing: 0.1em;\">NEW CLIENT DOSSIER</h1>" +
      "<p style=\"color: #a8a29e; font-size: 14px; line-height: 1.6; margin-bottom: 20px;\">A new inquiry has been submitted to the Tarius sanctuary.</p>" +
      "<div style=\"background-color: #292524; padding: 24px; text-align: left; margin-bottom: 40px; border-left: 2px solid #c8b99a;\">" +
      
      "<p style=\"margin: 0 0 12px 0;\"><strong style=\"color:#c8b99a; font-size:10px; text-transform:uppercase; letter-spacing:0.1em;\">Client Name:</strong> <br/>" + (body.name || "N/A") + "</p>" +
      "<p style=\"margin: 0 0 12px 0;\"><strong style=\"color:#c8b99a; font-size:10px; text-transform:uppercase; letter-spacing:0.1em;\">Email Address:</strong> <br/>" + (body.email || "N/A") + "</p>" +
      "<p style=\"margin: 0 0 12px 0;\"><strong style=\"color:#c8b99a; font-size:10px; text-transform:uppercase; letter-spacing:0.1em;\">Phone:</strong> <br/>" + (body.phone || "Not provided") + "</p>" +
      "<p style=\"margin: 0 0 12px 0;\"><strong style=\"color:#c8b99a; font-size:10px; text-transform:uppercase; letter-spacing:0.1em;\">Nature of Inquiry:</strong> <br/>" + (body.tier || "N/A") + "</p>" +
      "<p style=\"margin: 0 0 12px 0;\"><strong style=\"color:#c8b99a; font-size:10px; text-transform:uppercase; letter-spacing:0.1em;\">Preferred Contact:</strong> <br/>" + (body.preferredContact || "N/A") + "</p>" +

      "<h3 style=\"color: #c8b99a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #3f3f46; padding-bottom: 8px; margin-top: 24px;\">Client Message</h3>" +
      "<p style=\"color: #e5e5e5; font-size: 14px; line-height: 1.6; white-space: pre-wrap;\">" + (body.message || "No message provided.") + "</p>" +
      
      extraDetailsHTML +
      
      "</div></div>";

    await resend.emails.send({
      from: 'Tarius System <onboarding@resend.dev>',
      to: 'roshanwadhai175@gmail.com', 
      subject: "NEW DOSSIER: " + (body.name || "Client") + " (" + (body.tier || "Inquiry") + ")",
      html: adminHtml,
    });

    // 3. User Auto-Reply Email
    const userHtml = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #1a1a1a; color: #ffffff; text-align: center;\">" +
      "<p style=\"font-size: 10px; letter-spacing: 0.3em; color: #c8b99a; text-transform: uppercase; margin-bottom: 20px;\">Private Concierge</p>" +
      "<h1 style=\"font-size: 24px; font-weight: normal; margin-bottom: 30px; letter-spacing: 0.1em;\">TARIUS</h1>" +
      "<p style=\"color: #a8a29e; font-size: 14px; line-height: 1.6; margin-bottom: 20px;\">Dear " + (body.name || "Client") + ",</p>" +
      "<p style=\"color: #a8a29e; font-size: 14px; line-height: 1.6; margin-bottom: 40px;\">We have securely received your request. A dedicated member of our concierge team will review your dossier and contact you shortly.</p>" +
      "<p style=\"color: #57534e; font-size: 10px; margin-top: 40px;\">Do not reply directly to this email. For immediate assistance, please visit the sanctuary portal.</p>" +
      "</div>";

    await resend.emails.send({
      from: 'Tarius Concierge <onboarding@resend.dev>',
      to: 'roshanwadhai175@gmail.com', // MUST STAY AS YOUR EMAIL UNTIL DOMAIN IS VERIFIED
      subject: 'TARIUS: Allocation Request Received',
      html: userHtml,
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Email alert failure:', error);
    return NextResponse.json({ error: 'Failed to dispatch alerts' }, { status: 500 });
  }
}