/**
 * All user-facing strings live here.
 * Components MUST import from this file rather than hard-coding literals.
 * Zero forbidden words: blockchain, wallet (except "your balance"),
 * XRPL, RLUSD, ledger, seed phrase, private key, transaction, crypto.
 */

export const COPY = {
  app: {
    name: "Nostradameme",
    tagline: "The oracle never lies. Probably.",
    domain: "nostradameme.com",
  },

  header: {
    logo: "NOSTRADAMEME",
    addFunds: "+ Add Funds",
    balanceLabel: "Balance",
  },

  slots: {
    morning: { key: "morning", emoji: "\u2600\ufe0f", label: "Morning Prophecy \u00b7 9h\u201312h", short: "9H" },
    noon: { key: "noon", emoji: "\ud83c\udf24\ufe0f", label: "Noon Prophecy \u00b7 12h\u201300h", short: "12H" },
    night: { key: "night", emoji: "\ud83c\udf19", label: "Night Prophecy \u00b7 00h\u20139h", short: "00H" },
    weekly: { key: "weekly", emoji: "\u2728", label: "Weekly Prophecy", short: "WEEK" },
  },

  oracle: {
    states: {
      bullish: "The oracle smiles upon YES",
      bearish: "The oracle sees darkness ahead",
      uncertain: "The oracle wavers, unsure",
      balanced: "The oracle holds the balance",
      dormant: "The oracle rests",
    },
    spoken: "THE ORACLE HAS SPOKEN",
    sealed: "YOUR PROPHECY IS SEALED",
    won: "The oracle smiled upon you",
    lost: "Even Nostradamus was wrong sometimes",
    locked: "\ud83d\udd12 Locked \u2014 awaiting the oracle",
    remaining: "remaining",
    opensIn: "Opens in",
    totalLabel: "Total",
    silent: "The oracle is silent. Return at dawn.",
  },

  bet: {
    yes: "YES",
    no: "NO",
    yesEmoji: "\ud83d\udc41\ufe0f",
    noEmoji: "\ud83d\udc80",
    youSay: "You say",
    howMuch: "How much?",
    ifYesWins: "If YES wins",
    ifNoWins: "If NO wins",
    poolLabel: "Pool",
    seal: "Seal this Prophecy",
    sealing: "Sealing\u2026",
    cancel: "Cancel",
    insufficient: "Not enough funds",
    quickAmounts: [1, 5, 10, 25] as const,
    customLabel: "Custom",
    estimatedPayout: "Estimated winnings",
    minAmountError: "Minimum $1",
    maxAmountError: "Maximum $500",
  },

  liveFeed: {
    title: "Live Prophecies",
    empty: "The oracle chamber is silent\u2026",
    bet: "bet",
    secondsAgo: "s ago",
    minutesAgo: "m ago",
    hoursAgo: "h ago",
  },

  reveal: {
    heading: "THE ORACLE HAS SPOKEN",
    yesWon: "YES \u2014 The oracle chose life",
    noWon: "NO \u2014 The oracle chose darkness",
    youWon: "You were right!",
    youLost: "The oracle disagreed",
    winAmount: "You won",
    lossAmount: "You lost",
    shareWin: "Share your prophecy result",
    dismiss: "Tap to dismiss",
  },

  profile: {
    title: "Profile",
    tabs: {
      history: "History",
      leaderboard: "Leaderboard",
      settings: "Settings",
    },
    identity: {
      winRate: "Win Rate",
      predictions: "Predictions",
      earned: "Earned",
      balance: "Your Balance",
      addFunds: "+ Add Funds",
      withdraw: "Withdraw",
    },
    history: {
      activeGroup: "Active",
      wonGroup: "Won",
      lostGroup: "Lost",
      empty: "No prophecies sealed yet",
      loadMore: "Load more",
      youSaid: "You said",
      status: "Status",
      result: "Result",
      active: "Active",
      won: "WON",
      lost: "LOST",
      shareWin: "Share this win",
      hoursLeft: "left",
    },
    leaderboard: {
      title: "Oracle Leaderboard",
      periods: {
        all_time: "All Time",
        weekly: "This Week",
        daily: "Today",
      },
      columns: {
        rank: "#",
        oracle: "Oracle",
        winRate: "Win%",
        earned: "Earned",
        bets: "Bets",
      },
      you: "YOU",
      updated: "Last updated",
      loading: "Summoning the rankings\u2026",
      empty: "No oracles have predicted yet",
    },
    settings: {
      identity: "Identity",
      username: "Username",
      usernamePlaceholder: "Your oracle name",
      oracleTitle: "Your Oracle Title",
      account: "Account",
      email: "Email",
      signOut: "Sign Out",
      balance: "Balance",
      currentBalance: "Current balance",
      addFunds: "+ Add Funds",
      history: "View history",
      notifications: "Notifications",
      notifyOnResolution: "Notify me when my prophecy resolves",
      notifyOnNewMarket: "Notify me 15 minutes before a new prophecy opens",
      pushTitle: "Push notifications on this device",
      pushEnable: "Enable push notifications",
      pushDisable: "Disable push notifications",
      pushUnsupported: "Your browser does not support push notifications.",
      pushDenied: "Notifications blocked. Allow them in your browser settings.",
      pushEnabled: "Push notifications are active on this device.",
      pushLoading: "Checking\u2026",
      legal: "Legal",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      responsible:
        "This is a prediction game. Play responsibly.",
      dangerZone: "Danger Zone",
      closeAccount: "Close my account",
      saveChanges: "Save changes",
      saved: "Saved",
    },
  },

  share: {
    buttonAfterBet: "Share your prophecy",
    buttonAfterWin: "Share your victory",
    copied: "Copied!",
    copy: "Copy link",
    tweet: "Share on X",
    textAfterBet: (question: string, side: string, url: string) =>
      `\ud83d\udd2e I just predicted ${side} on:\n"${question}"\nDare to disagree? ${url}`,
    textAfterWin: (amount: string, url: string) =>
      `\ud83c\udfc6 The oracle spoke and I was right!\nJust won ${amount} on Nostradameme\n${url}`,
    refBanner: (name: string, side: string) =>
      `${name} predicted ${side}. Do you dare to disagree?`,
    title: "Nostradameme",
    willYouDare: "Will you dare to predict?",
    iSayYes: "I SAY YES",
    iSayNo: "I SAY NO",
    won: "WON",
  },

  depositSheet: {
    title: "Add Funds",
    subtitle: "Pay by card, your balance is ready in minutes.",
    amountLabel: "Amount in $",
    open: "Continue",
    close: "Cancel",
    processing: "Processing\u2026",
    ready: "Your funds are ready!",
  },

  errors: {
    generic: "Something went wrong. Try again.",
    notAuthed: "Please sign in to continue.",
    notAllowed: "Not allowed in your region.",
    marketLocked: "This prophecy is locked.",
    marketNotOpen: "This prophecy is not open.",
    insufficientBalance: "Not enough funds.",
    alreadyBet: "You already predicted on this prophecy.",
  },

  auth: {
    signIn: "Enter the chamber",
    signOut: "Leave the chamber",
    signInPrompt: "Sign in to seal your prophecy",
    emailPlaceholder: "your@email.com",
  },

  blocked: {
    title: "The oracle is silent here",
    body: "Nostradameme is not available in your region.",
  },

  admin: {
    title: "Oracle Operations",
    markets: "Markets",
    settings: "Settings",
    treasury: "Treasury",
  },

  legal: {
    notFinancialAdvice:
      "Nostradameme is a prediction game. Not financial advice.",
  },
} as const;

export type Copy = typeof COPY;
