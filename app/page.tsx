import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import { IEvent } from "@/database";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const Page = async () => {
  const response = await fetch(`${BASE_URL}/api/events`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  const events: IEvent[] = await response.json();

  return (
    <section>
      <h1 className="text-center">
        The Hub for Every Dev <br /> Event You Can&apos;t Miss
      </h1>

      <p className="text-center mt-5">
        Hackathons, Meetups, and Conferences, All in One Place
      </p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events">
          {events.length > 0 ? (
            events.map((event) => (
              <li key={event.title} className="list-none">
                <EventCard {...event} />
              </li>
            ))
          ) : (
            <p>No events found</p>
          )}
        </ul>
      </div>
    </section>
  );
};

export default Page;
