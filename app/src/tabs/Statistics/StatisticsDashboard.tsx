import { css } from "linaria";
import { styled } from "linaria/react";
import React, { useMemo, useState } from "react";
// import CountUp from "react-countup";
import { FaComments, FaUsers } from "react-icons/fa";
import ago from "s-ago";

import { ChannelGraph } from "./ChannelGraph";
import { WordCloud, WordData, TimeAreaChart } from "./components";
import { GrowthChart } from "./GrowthChart";
import IntegrityAlert from "./IntegrityAlert";
import { MemberGraph } from "./MemberGraph";
import { MentionsChart } from "./MentionsChart";
import { CustomEmojiIcon } from "@app/components/CustomEmoji";
import { PersonalMessagesChart } from "./PersonalMessagesChart";
// import StatisticsProvider from "./Statistics";
import { Timeline, TimelineItem } from "@app/components/Timeline";
import { appVerticalPadding, appHorizontalPadding } from "@app/layout";
import { usePool, usePoolEntities } from "@app/store/slices/pools";
import { GuildStatistics } from "@app/store/slices/statistics";
import { TabProps } from "@app/tabs/types";
import { snowflakeToDate } from "@app/utility/discord";
import {
  Channel,
  CustomEmoji,
  Member,
  Snowflake,
  User,
  Guild,
  HoarFrost,
} from "@app/utility/types";
import Card from "@architus/facade/components/Card";
import Logo from "@architus/facade/components/Logo";
import { color } from "@architus/facade/theme/color";
import { down } from "@architus/facade/theme/media";
import { animation } from "@architus/facade/theme/motion";
import { gap } from "@architus/facade/theme/spacing";
import { Option } from "@architus/lib/option";
import { isDefined } from "@architus/lib/utility";
import { emoji } from "node-emoji";

// import whyDidYouRender from "@welldone-software/why-did-you-render";

const Styled = {
  PageOuter: styled.div`
    position: relative;
    display: flex;
    justify-content: stretch;
    align-items: stretch;
    flex-direction: column;
    padding: ${appVerticalPadding} ${appHorizontalPadding};
  `,
  Title: styled.h2`
    color: ${color("textStrong")};
    font-size: 1.9rem;
    font-weight: 300;
    margin-bottom: ${gap.nano};
  `,
  IntegrityAlert: styled(IntegrityAlert)`
    margin: ${gap.pico} 0;
  `,
  Logo: styled(Logo.Symbol)`
    font-size: 2em;
    fill: ${color("light")};
    padding: 0px 20px;
    display: flex;
    align-items: center;
  `,
  HeaderCards: styled.div`
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    flex-direction: row;
    margin: ${gap.pico} 0;
    gap: calc(2 * ${gap.pico});

    ${down("md")} {
      flex-wrap: wrap;
    }

    & > * {
      opacity: 0;
      ${animation("fadeIn")}
    }

    ${[...Array(3)]
      .map(
        (_, i) => `& > :nth-child(${i + 1}) {
          animation: fadeIn 0.5s ${i * 0.05 + 0.05}s linear forwards;
        }`
      )
      .join("\n")}
  `,
  CardContainer: styled.div`
    display: grid;
    height: 100%;
    width: 100%;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    grid-auto-rows: 200px;
    grid-auto-flow: dense;
    gap: calc(2 * ${gap.pico});
    justify-items: stretch;
    margin: ${gap.pico} 0 0;

    & > * {
      opacity: 0;
      ${animation("fadeIn")}
    }

    ${[...Array(9)]
      .map(
        (_, i) => `& > :nth-child(${i + 1}) {
          animation: fadeIn 0.5s ${0.05 * i + 0.2}s linear forwards;
        }`
      )
      .join("\n")}
  `,
  ContentContainer: styled.div`
    position: relative;
    display: flex;
    align-items: center;
    flex-direction: row;
  `,
  FadeIn: css`
    animation: fadeIn 2s linear forwards;
  `,
  LabelContainer: styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-bottom: ${gap.nano};
    color: ${color("light")};
  `,
  Description: styled.p`
    margin-bottom: 0;
    font-size: 0.9em;
    margin-top: -${gap.pico};
    color: ${color("light")} !important;
  `,
  MessageCard: styled(Card)`
    width: 100%;
    border: none;
    flex: 1 1 0px;
    background-color: #5850ba;
    background-image: linear-gradient(62deg, #5850ba 0%, #844ea3 100%);
    padding: 16px;
  `,
  ArchitusCard: styled(Card)`
    width: 100%;
    border: none;
    padding: 16px;
    flex: 1 1 0px;
    background-color: #ba5095;
    background-image: linear-gradient(62deg, #ba5095 0%, #ffbfa7 100%);
  `,
  MemberCard: styled(Card)`
    width: 100%;
    border: none;
    padding: 16px;
    flex: 1 1 0px;
    background-color: #844ea3;
    background-image: linear-gradient(62deg, #844ea3 0%, #ba5095 100%);
  `,
  Card: styled(Card)`
    grid-column: span auto;
    grid-row: span auto;

    & > h4 {
      margin: 0px;
    }
  `,
  BigCard: styled(Card)`
    grid-column: span 2;
    grid-row: span 2;
  `,
  TallCard: styled(Card)`
    grid-column: span 1;
    grid-row: span 2;
  `,
  LongCard: styled(Card)`
    grid-column: span 2;
    grid-row: span 1;
  `,
  EmojiContainer: styled.div`
    margin-top: ${gap.nano};
    display: grid;
    max-width: 100%;
    max-height: 100%;
    grid-template-rows: 48px 48px;
    grid-template-columns: minmax(48px, 1fr) minmax(48px, 1fr) minmax(48px, 1fr);
    gap: ${gap.nano};
  `,
  Image: styled.img`
    width: 100px;
    height: auto;
  `,
  CountUp: styled.p`
    font-size: 2.5em;
  `,
};

const iconClass = css`
  font-size: 2em;
  color: ${color("light")};
  margin: 0px 20px;
`;

type StatisticsDashboardProps = {
  // members: Map<Snowflake, Member>;
  // channels: Map<string, Channel>;
  // emojis: Map<string, CustomEmoji>;
  isArchitusAdmin: boolean;
  currentUser: User;
  stats: Option<GuildStatistics>;
  guild: Guild;
} & TabProps;

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  stats,
  currentUser,
  // members,
  // channels,
  // emojis,
  guild,
}) => {
  // console.count("stats dashboard");
  // const members = new Map();
  // const channels = new Map();
  // const emojis = new Map();

  // Load all the members into the pool
  const allMemberIds = useMemo(() => {
    const ids: Snowflake[] = [];
    if (stats.isDefined()) {
      Object.keys(stats.get.memberCounts).forEach((id) => {
        ids.push(id as Snowflake);
      });
    }
    return ids;
  }, [stats]);

  const memberEntries = usePoolEntities({
    type: "member",
    guildId: guild.id,
    ids: allMemberIds,
  });
  const members = useMemo(() => {
    // console.count("members");
    // console.log(memberEntries.length);
    const members: Map<Snowflake, Member> = new Map();
    for (const memberEntry of memberEntries) {
      if (memberEntry.isLoaded && memberEntry.entity.isDefined()) {
        members.set(memberEntry.entity.get.id, memberEntry.entity.get);
      }
    }
    return members;
  }, [memberEntries]);
  // console.log(allMemberIds);
  // console.log(members);

  const { all: channelsPool } = usePool({
    type: "channel",
    guildId: guild.id,
  });

  const emojiEntries = usePoolEntities({
    type: "customEmoji",
    guildId: guild.id,
    ids: stats.isDefined() ? stats.get.popularEmojis : [],
  });
  const emojis = useMemo(() => {
    const emojis: Map<HoarFrost, CustomEmoji> = new Map();
    for (const emojiEntry of emojiEntries) {
      if (emojiEntry.isLoaded && emojiEntry.entity.isDefined()) {
        emojis.set(emojiEntry.entity.get.id, emojiEntry.entity.get);
      }
    }
    return emojis;
  }, [emojiEntries]);

  const channels = useMemo(() => {
    const map: Map<string, Channel> = new Map();
    for (const channel of channelsPool) {
      map.set(channel.id as string, channel);
    }
    return map;
  }, [channelsPool]);

  const memberCount = useMemo((): number => {
    return stats.isDefined() ? stats.get.memberCount : 0;
  }, [stats]);

  const messageCount = useMemo((): number => {
    return stats.isDefined() ? stats.get.messageCount : 0;
  }, [stats]);

  const architusMessageCount = useMemo((): number => {
    return stats.isDefined() ? stats.get.architusCount : 0;
  }, [stats]);

  const lastSeen = useMemo((): Date => {
    return new Date(stats.isDefined() ? stats.get.lastActivity : 1420070400000);
  }, [stats]);

  const memberCounts = useMemo(() => {
    return stats.isDefined() ? stats.get.memberCounts : {};
  }, [stats]);

  const channelCounts = useMemo(() => {
    return stats.isDefined() ? stats.get.channelCounts : {};
  }, [stats]);

  const joinDate = useMemo((): Date => {
    if (isDefined(currentUser) && isDefined(currentUser.id)) {
      const member = members.get(currentUser.id as Snowflake);
      if (isDefined(member)) return new Date(member.joined_at);
    }
    return new Date(1420070400000);
  }, [currentUser, members]);

  const bestEmoji = useMemo((): CustomEmoji[] => {
    const urls = [];
    if (stats.isDefined()) {
      const { popularEmojis } = stats.get;
      for (let i = 0; i < 6; i++) {
        // console.log(emojis);
        const emoji = emojis.get(popularEmojis[i]);
        if (isDefined(emoji)) {
          urls.push(emoji);
        }
      }
    }
    return urls;
  }, [stats, emojis]);

  const getWords = (): Array<WordData> => {
    const words: Array<WordData> = [];
    if (stats.isDefined()) {
      const { commonWords } = stats.get;
      commonWords.slice(0, 100).forEach((word) => {
        words.push({ text: word[0], value: word[1] });
      });
    }
    return words;
  };
  const memWords = useMemo(getWords, [stats]);

  const timeData = useMemo((): Array<any> => {
    const data: Array<any> = [];
    const ids: Set<string> = new Set();
    if (stats.isDefined()) {
      //console.log(stats.get.timeMemberCounts);

      Object.entries(stats.get.timeMemberCounts).forEach(([date, rec]) => {
        const obj = { date: Date.parse(date) };
        if (obj.date < new Date().getTime() - 30 * 86400000) {
          return;
        }
        Object.entries(rec).forEach(([id, count]) => {
          obj[id] = count;
          ids.add(id);
          //const member = members.get(id as Snowflake);
          // console.log(count)
          //if (isDefined(member)) {
          //  obj[member.name] = count;
          //}
        });
        data.push(obj);
      });
    }
    data.sort((a, b) => a.date - b.date);
    return [data, ids];
  }, [stats]);

  const getMentionsChart = () => {
    if (stats.isDefined()) {
      return (
        <MentionsChart
          mentionCounts={stats.get.mentionCounts}
          members={members}
        />
      );
    }
    return <>no mentions</>;
  };

  const showAnimation = useState(false);
  const classes = showAnimation ? Styled.FadeIn : "";

  const membersClosure = (id: string) => {
    return members.get(id as Snowflake);
  };

  return (
    <Styled.PageOuter>
      <Styled.Title>Statistics</Styled.Title>
      <Styled.IntegrityAlert
        sKey={`statsForbidden${guild.id}`}
        message="architus does not have permission to access complete data from this server; some statistics may be inaccurate."
        enabled={stats.isDefined() ? stats.get.forbidden : false}
      />
      <Styled.IntegrityAlert
        sKey={`statsCounting${guild.id}`}
        message="architus is still indexing this server; some statistics may be inaccurate."
        enabled={stats.isDefined() ? !stats.get.upToDate : false}
      />
      <Styled.HeaderCards>
        <Styled.MessageCard>
          <Styled.ContentContainer>
            <FaComments className={iconClass} />
            <Styled.LabelContainer>
              <Styled.CountUp>{messageCount}</Styled.CountUp>
              <Styled.Description>Messages Sent</Styled.Description>
            </Styled.LabelContainer>
          </Styled.ContentContainer>
        </Styled.MessageCard>

        <Styled.MemberCard>
          <Styled.ContentContainer>
            <FaUsers className={iconClass} />
            <Styled.LabelContainer>
              <Styled.CountUp>{memberCount}</Styled.CountUp>
              <Styled.Description>Members</Styled.Description>
            </Styled.LabelContainer>
          </Styled.ContentContainer>
        </Styled.MemberCard>

        <Styled.ArchitusCard>
          <Styled.ContentContainer>
            <Styled.Logo />
            <Styled.LabelContainer>
              <Styled.CountUp>{architusMessageCount}</Styled.CountUp>
              <Styled.Description>Commands Executed</Styled.Description>
            </Styled.LabelContainer>
          </Styled.ContentContainer>
        </Styled.ArchitusCard>
      </Styled.HeaderCards>

      <Styled.CardContainer>
        <Styled.Card>
          <h4>Your Messages</h4>
          <PersonalMessagesChart
            currentUser={currentUser}
            totalMessages={messageCount}
            memberCounts={memberCounts}
          />
        </Styled.Card>

        <Styled.Card>
          <h4>Popular Emoji</h4>
          <Styled.EmojiContainer>
            {bestEmoji.map((e) => (
              <CustomEmojiIcon
                emoji={e}
                author={members.get(e.authorId)}
                key={e.id}
              />
            ))}
          </Styled.EmojiContainer>
        </Styled.Card>

        <Styled.BigCard>
          <h3>Messages over Time</h3>
          <TimeAreaChart ids={timeData[1]} data={timeData[0]} members={membersClosure} />
        </Styled.BigCard>

        <Styled.BigCard>
          <h3>Messages by Member</h3>
          <MemberGraph memberCounts={memberCounts} members={members} />
        </Styled.BigCard>

        <Styled.TallCard>
          <h4>Timeline</h4>
          <Timeline>
            <TimelineItem date={snowflakeToDate(currentUser.id)}>
              You joined discord
            </TimelineItem>
            <TimelineItem date={snowflakeToDate(guild.id)}>
              {guild.name} was created
            </TimelineItem>
            <TimelineItem date={joinDate}>You joined {guild.name}</TimelineItem>
            <TimelineItem
              date={
                new Date(
                  lastSeen.getTime() - 60 * 1000 * lastSeen.getTimezoneOffset()
                )
              }
              dateFormatter={ago}
            >
              Last activity in {guild.name}
            </TimelineItem>
          </Timeline>
        </Styled.TallCard>

        <Styled.Card>
          <h4>Server Growth</h4>
          <GrowthChart members={members} />
        </Styled.Card>

        <Styled.Card>
          <h4>Mentions</h4>
          {getMentionsChart()}
        </Styled.Card>

        <Styled.BigCard>
          <h3>Messages by Channel</h3>
          <ChannelGraph channelCounts={channelCounts} channels={channels} />
        </Styled.BigCard>
        <Styled.BigCard>
          <h3>Popular Words</h3>
          <WordCloud words={memWords} />
        </Styled.BigCard>
      </Styled.CardContainer>
    </Styled.PageOuter>
  );
};

// StatisticsDashboard.whyDidYouRender = true;
export default StatisticsDashboard;
