// Agreement wording, version 1. Contracts keep the version they were sent with,
// so changing wording later means adding terms-v2.js, not editing this file.
(function () {
  window.JSUC_TERMS = window.JSUC_TERMS || {};
  window.JSUC_TERMS.v1 = function (d) {
    return [
      {
        title: "Event details",
        rows: [
          ["Client", d.clientName],
          ["Phone and email", d.phone ? d.phone + " / " + d.clientEmail : "Provided below / " + d.clientEmail],
          ["Event date", d.dateText],
          ["Start and end time", d.timeText],
          ["Venue", d.venue],
          ["On-site contact", d.onsite || "Provided below"],
          ["Total fee", d.feeText],
          ["Experience booked", d.experienceName],
          ["Photos and video on social media", d.photos || "Chosen below"],
          ["Client's Instagram handle, if tagging", d.ig || (d.signed ? "None" : "Provided below if tagging")],
        ],
      },
      {
        title: "Parties and services",
        lead: "Joshua Stacy, doing business as Joshua Stacy Up Close (“Performer”), will perform close-up magic for the person or organization named in Event details (“Client”) on the date and terms below.",
        items: [
          { text: "Performer contact: Fayetteville, AR. booking@joshuastacyupclose.com. (479) 510-3304. @Joshua_Stacy_Up_Close." },
          { label: "Experiences.", text: "The Hangout (Performer moves through the room, performing for guests one small group at a time), The Station (Performer works at a set table and guests come to it), or The Show (a seated 45 minute performance), as marked in Event details." },
          { label: "Minimum booking.", text: "45 minutes for The Show. 2 hours for The Hangout or The Station." },
          { label: "Performance time.", text: "The Show is one continuous 45 minute performance. The Hangout and The Station run across the booked window, with short breaks as Performer needs them." },
          { label: "Audience size.", text: "The Show seats up to 50 guests." },
          { label: "Material.", text: "Performer chooses all material and adjusts it to the room. Nothing explicit." },
        ],
      },
      {
        title: "Fees and payment",
        lead: "Client pays the total fee in Event details. A 25% deposit holds the date, and the balance is due before the performance starts.",
        items: [
          { label: "Deposit.", text: "25% of the total fee, due when Client signs. The deposit is nonrefundable because it holds the date, and it counts toward the total fee." },
          { label: "Balance.", text: "Due before the performance starts, by cash, Venmo, or PayPal. Payments are made to Joshua Stacy Up Close." },
          { label: "Overtime.", text: "If Performer is available and agrees to stay past the end time, additional time is $150 per hour, billed in 30 minute blocks ($75 each) and paid the same day." },
          { label: "Travel.", text: "No travel fee within 30 miles of Fayetteville, AR. Past that, Client pays $0.725 per mile for each mile beyond 30, counted both ways, using Google Maps driving distance. Example: a venue 45 miles away adds 15 miles each way, or 30 miles, for $21.75." },
        ],
      },
      {
        title: "Cancellation and rescheduling",
        lead: "If Client cancels more than 7 days before the event, the deposit is the only amount owed. Within 7 days, the full fee is owed.",
        items: [
          { label: "Client cancels.", text: "Client may cancel by text or email. If the event is more than 7 days away, Performer keeps the deposit and nothing more is owed. If the event is 7 days away or less, the full fee is owed. Performer refunds anything Client has paid beyond what is owed within 10 days." },
          { label: "Client reschedules.", text: "Client may move the event once at no charge, if Performer is available on the new date and gets the request at least 7 days before the event. The deposit carries over. Any further move counts as a cancellation." },
          { label: "Performer cancels.", text: "If illness or an emergency stops Performer from performing, Performer refunds everything Client has paid and will try to refer a replacement performer. Performer owes nothing beyond that." },
          { label: "Late start.", text: "If the event starts late or runs behind, Performer still finishes at the agreed end time, unless Performer agrees to stay longer. Extra time is billed as overtime." },
          { label: "Case by case.", text: "Performer may adjust or waive any term, such as a fee or the cancellation rules, when circumstances call for it. Performer confirms any change by text or email, and it applies only to that situation." },
        ],
      },
      {
        title: "Client responsibilities",
        lead: "Client provides a workable space and one person Performer can reach during the event.",
        items: [
          { label: "Setup.", text: "Access to the performing area 15 minutes before the start time, with room for Performer to set up." },
          { label: "Lighting.", text: "A well lit performing area." },
          { label: "Sound.", text: "A room quiet enough for guests to talk and hear, with music lowered during performances." },
          { label: "Gear.", text: "A safe place for Performer's bag and gear." },
          { label: "Access.", text: "Parking or load-in access near the entrance." },
          { label: "On-site contact.", text: "A named person, listed in Event details, who can be reached during the event." },
          { label: "Venue permission.", text: "Client arranges the venue, confirms it allows entertainers, and covers any venue fees, permits, or approvals." },
          { label: "The Show seating.", text: "For The Show, Client provides seating for all guests with a clear view of the performing area." },
        ],
      },
      {
        title: "Conduct, recording, and methods",
        lead: "Performer may end the show early if the room becomes unsafe, and the fee still applies.",
        items: [
          { label: "Leaving early.", text: "Performer may end the performance early, with no refund and any unpaid balance still due, if guests harass or touch Performer, behave aggressively or unsafely, are so intoxicated the show cannot work, if conditions at the venue are unsafe, or if Client or the host breaks this agreement." },
          { label: "Guest recording.", text: "Guests must ask Performer before filming or photographing during a performance." },
          { label: "Performer recording.", text: "Performer may photograph or film the event and post the results, unless Client asks for no posting in Event details. Performer names or tags Client only if Client approves there." },
          { label: "Protecting methods.", text: "Client and Client's guests, including any hired photographer or videographer, agree not to expose or explain Performer's methods, in any recording or in any other way." },
        ],
      },
      {
        title: "Liability and legal terms",
        lead: "Neither side is responsible for events outside its control.",
        items: [
          { label: "Events outside anyone's control.", text: "Severe weather, illness or injury, a family emergency, venue closure, or a road closure or travel disruption excuses either side from performing. The parties will try to set a new date, and the deposit carries over to it. If they cannot agree on a date within 12 months, Performer keeps the deposit and nothing more is owed. If Performer is the one unable to perform, Performer's cancellation terms apply instead." },
          { label: "Disputes.", text: "The parties will first try to resolve any dispute by talking it through in good faith. If that fails, either side may file in Washington County, Arkansas, including small claims court. Arkansas law governs this agreement. Each side pays its own attorney fees." },
          { label: "Whole agreement.", text: "This agreement, with Event details, is the full agreement and replaces any earlier promises. Changes must be in writing, and a text or email from both sides counts." },
          { label: "If a term fails.", text: "If any part of this agreement is found unenforceable, the rest stays in effect." },
        ],
      },
      {
        title: "Signatures",
        lead: "The date is held once Performer receives this agreement signed and the deposit within 7 days of sending it. After that, Performer may release the date.",
        items: [
          { text: "This agreement may be signed on paper or electronically. Typing your full name in the signature box counts as your signature. A photo, scan, or electronic copy of a signed agreement is as valid as the original." },
        ],
      },
    ];
  };
})();
