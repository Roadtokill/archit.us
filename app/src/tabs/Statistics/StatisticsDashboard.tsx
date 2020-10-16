import { styled } from "linaria/react";
import { css } from "linaria";
import React from "react";
import CountUp from "react-countup";
import { FaComments, FaUsers } from "react-icons/fa";
import { WordCloud, WordData, TimeAreaChart } from "./components";
import { MentionsChart } from "./MentionsChart";
import IntegrityAlert from "./IntegrityAlert";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { appVerticalPadding, appHorizontalPadding } from "@app/layout";
import { GuildStatistics } from "@app/store/slices/statistics";
import { TabProps } from "@app/tabs/types";
import { Channel, CustomEmoji, Member, Snowflake, User, Guild } from "@app/utility/types";
import Card from "@architus/facade/components/Card";
import Logo from "@architus/facade/components/Logo";
import { color } from "@architus/facade/theme/color";
import { down } from "@architus/facade/theme/media";
import { gap } from "@architus/facade/theme/spacing";
import { Option } from "@architus/lib/option";
import { isDefined } from "@architus/lib/utility";

const Styled = {
  PageOuter: styled.div`
    position: relative;
    display: flex;
    justify-content: stretch;
    align-items: stretch;
    flex-direction: column;
    height: 100%;
    padding: ${appVerticalPadding} ${appHorizontalPadding};
  `,
  Title: styled.h2`
    color: ${color("textStrong")};
    font-size: 1.9rem;
    font-weight: 300;
  `,
  IntegrityAlert: styled(IntegrityAlert)`
    margin: ${gap.pico}
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

    ${down("md")} {
      flex-wrap: wrap;
    }
  `,
  CardContainer: styled.div`
    display: grid;
    height: 100%;
    width: 100%;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    grid-auto-rows: 200px;
    grid-auto-flow: dense;
    gap: ${gap.pico};
    justify-items: stretch;
  `,
  ContentContainer: styled.div`
    position: relative;
    display: flex;
    align-items: center;
    flex-direction: row;
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
    margin: ${gap.pico};
    width: 100%;
    border: none;
    flex: 1 1 0px;
    background-color: #5850ba;
    background-image: linear-gradient(62deg, #5850ba 0%, #844ea3 100%);
    padding: 16px;
  `,
  ArchitusCard: styled(Card)`
    margin: ${gap.pico};
    width: 100%;
    border: none;
    padding: 16px;
    flex: 1 1 0px;
    background-color: #ba5095;
    background-image: linear-gradient(62deg, #ba5095 0%, #ffbfa7 100%);
  `,
  MemberCard: styled(Card)`
    margin: ${gap.pico};
    width: 100%;
    border: none;
    padding: 16px;
    flex: 1 1 0px;
    background-color: #844ea3;
    background-image: linear-gradient(62deg, #844ea3 0%, #ba5095 100%);
  `,
  Card: styled(Card)`
    margin: 5px;
    grid-column: span auto;
    grid-row: span auto;

    & > h4 {
      margin: 0px;
    }
  `,
  BigCard: styled(Card)`
    margin: 5px;
    grid-column: span 2;
    grid-row: span 2;
  `,
  Image: styled.img``,
  CountUp: styled(CountUp)`
    font-size: 2.5em;
  `,
};

const iconClass = css`
  font-size: 2em;
  color: ${color("light")};
  margin: 0px 20px;
`;

type StatisticsDashboardProps = {
  members: Map<Snowflake, Member>;
  channels: Map<string, Channel>;
  emojis: Map<string, CustomEmoji>;
  isArchitusAdmin: boolean;
  currentUser: User;
  stats: Option<GuildStatistics>;
  guild: Guild;
} & TabProps;

type ChannelData = {
  name: string;
  count: number;
};

type MemberData = {
  name: string;
  count: number;
};

type PersonalMessageData = {
  name: string;
  value: number;
};

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  stats,
  currentUser,
  members,
  channels,
  emojis,
  guild,
}) => {
  const getMemberCount = (): number => {
    return stats.isDefined() ? stats.get.memberCount : 0;
  };

  const getMessageCount = (): number => {
    return stats.isDefined() ? stats.get.messageCount : 0;
  };

  const getArchitusMessageCount = (): number => {
    return stats.isDefined() ? stats.get.architusCount : 0;
  };

  const getLastSeen = (): Date => {
    return new Date(stats.isDefined() ? stats.get.lastActivity : 1420070400000);
  };

  const getBestEmoji = (): string => {
    if (stats.isDefined()) {
      const popularEmojis = stats.get.popularEmojis;
      if (popularEmojis.length > 0) {
        // console.log(emojis);
        const emoji = emojis.get(popularEmojis[0]);
        if (isDefined(emoji)) {
          return emoji.url;
        }
      }
    }
    return "";
  }

  const getChannelData = (): ChannelData[] => {
    const data: ChannelData[] = [];
    if (stats.isDefined()) {
      const channelIds = stats.get.channelCounts;
      Object.entries(channelIds).forEach(([key, value]) => {
        const channel = channels.get(key);
        if (isDefined(channel)) {
          data.push({ name: channel.name, count: value });
        }
      });
    }
    data.sort((a, b) => (a.count < b.count ? 1 : -1));
    return data.slice(0, 15);
  };

  const getMemberData = (): MemberData[] => {
    const data: MemberData[] = [];
    if (stats.isDefined()) {
      const memberIds = stats.get.memberCounts;
      Object.entries(memberIds).forEach(([key, value]) => {
        const member = members.get(key as Snowflake);
        if (isDefined(member)) {
          data.push({ name: member.name, count: value });
        }
      });
    }
    data.sort((a, b) => (a.count < b.count ? 1 : -1));
    return data.slice(0, 15);
  };

  const getPersonalMessageData = (): PersonalMessageData[] => {
    if (stats.isDefined()) {
      const total = stats.get.messageCount;
      const userCount = stats.get.memberCounts[currentUser.id as string];
      return [
        { name: "me", value: userCount },
        { name: "not me", value: total - userCount },
      ];
    }
    return [];
  };

  const getWords = (): Array<WordData> => {
    const words: Array<WordData> = [];
    if (stats.isDefined()) {
      const commonWords = stats.get.commonWords;
      commonWords.slice(0, 100).forEach((word) => {
        words.push({text: word[0], value: word[1]})
      })
    }
    return words;
  }

  const getTimeData = (): Array<any> => {
    const data: Array<any> = [];
    if (stats.isDefined()) {
      Object.entries(stats.get.timeMemberCounts).forEach(([date, rec]) => {
        let obj = {date: Date.parse(date)};
        if (obj.date < (new Date).getTime() - 90 * 86400000) {
          return;
        }
        members.forEach((member) => {
          obj[member.name] = isDefined(rec[member.id]) ? rec[member.id] : 0;
        })
        data.push(obj);
      })
    }
    data.sort((a, b) => a.date - b.date);
    return data;
  }

  //<Area type="monotone" dataKey="amt" stackId="1" stroke="#5850ba" fill="#5850ba" />
  //<Area type="monotone" dataKey="uv" stackId="1" stroke="#844ea3" fill="#844ea3" />
  //<Area type="monotone" dataKey="pv" stackId="1" stroke="#ba5095" fill="#ba5095" />

  const getMemberChart = () => {
    if (stats.isDefined()) {
      return (<MentionsChart mentionCounts={stats.get.mentionCounts} members={members} />);
    }
    return (<>no mentions</>);
  }


  return (
    <Styled.PageOuter>
      <Styled.Title>Statistics</Styled.Title>
      <Styled.IntegrityAlert
        key={`statsForbidden${guild.id}`}
        message="architus does not have permission to access complete data from this server; some statistics may be inaccurate."
        enabled={stats.isDefined() ? stats.get.forbidden : false}
      />
      <Styled.IntegrityAlert
        key={`statsCounting${guild.id}`}
        message="architus is still indexing this server; some statistics may be inaccurate."
        enabled={stats.isDefined() ? !stats.get.upToDate : false}
      />
      <Styled.HeaderCards>
        <Styled.MessageCard>
          <Styled.ContentContainer>
            <FaComments className={iconClass} />
            <Styled.LabelContainer>
              <Styled.CountUp end={getMessageCount()} duration={5} />
              <Styled.Description>Messages Sent</Styled.Description>
            </Styled.LabelContainer>
          </Styled.ContentContainer>
        </Styled.MessageCard>
        <Styled.MemberCard>
          <Styled.ContentContainer>
            <FaUsers className={iconClass} />
            <Styled.LabelContainer>
              <Styled.CountUp end={getMemberCount()} duration={5} />
              <Styled.Description>Members</Styled.Description>
            </Styled.LabelContainer>
          </Styled.ContentContainer>
        </Styled.MemberCard>
        <Styled.ArchitusCard>
          <Styled.ContentContainer>
            <Styled.Logo />
            <Styled.LabelContainer>
              <div>
                <Styled.CountUp end={getArchitusMessageCount()} duration={5} />
              </div>
              <Styled.Description>Commands Executed</Styled.Description>
            </Styled.LabelContainer>
          </Styled.ContentContainer>
        </Styled.ArchitusCard>
      </Styled.HeaderCards>
      <Styled.CardContainer>
        <Styled.Card>
          <h4>Your Messages</h4>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={getPersonalMessageData()}
                cx={"50%"}
                cy={"50%"}
                innerRadius={"65%"}
                outerRadius={"90%"}
                fill="#844EA3"
                paddingAngle={5}
                dataKey="value"
              >
                <Cell key="cell-0" fill="#ba5095" strokeWidth={0} />
                <Cell key="cell-1" fill="#844EA3" strokeWidth={0} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Styled.Card>
        <Styled.Card>
          <h4>Popular Emoji</h4>
          <div>
            <Styled.Image src={getBestEmoji()} />
          </div>
        </Styled.Card>
        <Styled.Card>
          <h4>Mentions</h4>
          {getMemberChart()}
        </Styled.Card>
        <Styled.Card>
          <h4>Last Activity</h4>
          {new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "2-digit",
          }).format(getLastSeen())}
        </Styled.Card>
        <Styled.BigCard>
          <h3>Messages over Time</h3>
          <TimeAreaChart members={members} data={getTimeData()} />
        </Styled.BigCard>
        <Styled.BigCard>
          <h3>Messages by Member</h3>
          <ResponsiveContainer>
            <BarChart
              data={getMemberData()}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#844ea3" />
            </BarChart>
          </ResponsiveContainer>
        </Styled.BigCard>
        <Styled.BigCard>
          <h3>Messages by Channel</h3>
          <ResponsiveContainer>
            <BarChart
              data={getChannelData()}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ba5095" />
            </BarChart>
          </ResponsiveContainer>
        </Styled.BigCard>
        <Styled.Card>
          <h4>Member Since</h4>
        </Styled.Card>
        <Styled.BigCard>
          <h3>Popular Words</h3>
          <WordCloud words={getWords()} />
        </Styled.BigCard>
      </Styled.CardContainer>
    </Styled.PageOuter>
  );
};

export default StatisticsDashboard;
