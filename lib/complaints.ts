// Real public complaints about tap-in/tap-out ticketing on London transport,
// curated from community forums and press coverage. Each entry links out to
// the original post. Surfaced via a last30days research pass (see repo docs);
// refresh by re-running that research and editing this list.

export interface ComplaintPost {
  quote: string
  context: string
  source: string
  url: string
}

export const COMPLAINT_POSTS: ComplaintPost[] = [
  {
    quote:
      "I was only travelling one stop — about 100 metres — and had already capped out on the daily charge. To be fined £40 when TfL aren't out of pocket is unreasonable.",
    context: "Fined at Elverson Road despite paying the daily cap",
    source: "RailUK Forums",
    url: "https://www.railforums.co.uk/threads/penalty-fare-on-dlr-had-capped-out.125307/",
  },
  {
    quote:
      "I did tap back in but the tap didn't get read. I'm not a machine nor an engineer, I can't force it to work.",
    context: "Student appealing a £50 penalty after a failed reader",
    source: "RailUK Forums",
    url: "https://www.railforums.co.uk/threads/advice-for-arguing-penalty-fare-despite-tap-in-during-journey.305030/",
  },
  {
    quote:
      "I forgot to tap in my Oyster card and got caught and given a £40 penalty fare. I'm freaking out over this.",
    context: "Greenwich to Shadwell, unfamiliar with unbarriered stations",
    source: "RailUK Forums",
    url: "https://www.railforums.co.uk/threads/accidentally-fare-dodged-worried.132002/",
  },
  {
    quote:
      "Was on the DLR, somehow my Oyster card tap in didn't go through. Could I potentially face a penalty charge?",
    context: "Tap failed to register at an unbarriered DLR station",
    source: "RailUK Forums",
    url: "https://www.railforums.co.uk/threads/dlr-station-tap-in-didnt-go-through-on-my-oyster-card.297776/",
  },
  {
    quote:
      "I came and approached you — but no. 'That's a £25 fine, sir.' As a horde of commuters streamed past us, unchecked.",
    context: "Proactively asked staff to verify a tap at Canning Town, fined anyway",
    source: "complaintletter.org.uk",
    url: "https://complaintletter.org.uk/1809-2/",
  },
  {
    quote:
      "TfL been making me broke. The day I don't tap on, the guy checks.",
    context: "Student caught by an on-train fare checker",
    source: "The Student Room",
    url: "https://www.thestudentroom.co.uk/showthread.php?t=7200462",
  },
]
