const paginateMessages = (message: string, wordsPerPage: number = 50) => {
  const words = message.split(" ");
  const pages: string[] = [];
  let cursorOffset = 0;
  let cursor = 0;

  let page = "";
  while (cursor < words.length) {
    if (cursor - cursorOffset < wordsPerPage) {
      page += (page.length > 0 ? " " : "") + words[cursor];
      cursor++;
    } else {
      pages.push(`${page}...`);

      cursorOffset += wordsPerPage;
      page = "";
    }
  }

  pages.push(page);

  return pages;
};

const messages = `Alright, since it's your first time here, we'll start you off with the basics. You'll see the seniors running around doing lots of things: Dispatching trucks, talking on the phone with our industry guys to make sure the production lines are running etc. Don't worry about that stuff for now though. Boss has asked me to walk you through how we get contracts. Because at the end of the day, that's what we're here for. We haul stuff around and get paid for it. Contracts usually come in pretty quickly. I'll let you know when one pops up, and we can go through it together.`;

const pages = paginateMessages(messages, 2);

pages.forEach((p, i) => {
  console.log(`page ${i + 1}: `, p);
});
