import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
import { StoresService, storeType } from '../stores/stores.service';
import { GroupsService } from '../groups/groups.service';
import { REWARD_STAGE_BY_POSITION } from './const/reward-stage-by-position.const';
import { ConfigService } from '@nestjs/config';
import { STANDINGS_HOUR_PROCESS } from './const/standing-hour-process.const';
import { filterNull } from '../utils/filter-null-data';
import { teamStatV2 } from './type';

dayjs.extend(utc);
dayjs.extend(tz);

type matchResultType = {
  Home: string;
  Away: string;
  BusDate: string;
  HomeId: string;
  AwayId: string;
  HomeTarget: string;
  AwayTarget: string;
  HomeIdrSales: string;
  AwayIdrSales: string;
  HomePercent: string;
  AwayPercent: string;
  Winner: string;
  Loser: string;
  PointCount: string;
  IdrPerPoint: string;
  TotalIdr: string;
  PartialGiven: string;
  IdrGivenPartialUpToDateAsOfSale: string;
  Publish?: string;
};

export type teamStat = {
  team: string;
  totalMatches: number;
  totalPoint: number;
  win: number;
  lose: number;
  totalReward: number;
  totalPaid: number;
  totalAchv: number;
  totalSales: number;
  totalTarget: number;
  pref: string | null;
  position: number;
  group?: string | null;
  teamImg: string;
};

type totalAchvConstruct = {
  id: string;
  team: string;
  busDate: string;
  sales: string;
  target: string;
};

type matchType = {
  team1: string;
  team2: string;
  team1Achv: number;
  team2Achv: number;
  date: string;
  am1: string | null;
  ssh1: string | null;
  sh1: string | null;
  am2: string | null;
  ssh2: string | null;
  sh2: string | null;
  team1ImageUrl: string | null;
  team2ImageUrl: string | null;
  salesUpdateTime: string | null;
  isApproved?: number;
};

type matchResultWithAllWildcard = {
  name: string;
  teams: teamStat[];
};

@Injectable()
export class MatchesService {
  constructor(
    private readonly redisService: RedisService,
    private readonly storeService: StoresService,
    private readonly groupService: GroupsService,
    private readonly configService: ConfigService,
  ) {}

  logger = new Logger(MatchesService.name);

  async matchResultStanding(competition: string, stage: string, group: string) {
    try {
      const tz = this.configService.get<string>('APP_TZ');
      const yesterday = dayjs.tz(this.getFilterDate(), tz).subtract(1, 'day');
      const yesterdayDate = yesterday.format('YYYY-MM-DD');

      const currentMatchResult = await this.matchesResultRedis(
        competition,
        stage,
        group,
      );

      const prevMatchResult = await this.matchesResultRedis(
        competition,
        stage,
        group,
        yesterdayDate,
      );

      const updatedCurrentStanding = this.calculatePositionChange(
        currentMatchResult.slice(),
        prevMatchResult.slice(),
      );

      return updatedCurrentStanding;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async matchesResultRedis(
    competition: string,
    stage: string,
    group: string,
    yesterdayDate?: string,
  ) {
    try {
      //TODO: sort by point, achievement then match played
      let matchResult: teamStat[];
      const config = await this.getCompetitionConfig(competition, stage);

      const matchesResultId = `Matchup-${competition}-${stage}-${group}`;
      const data = (await this.redisService.get(matchesResultId)) as Array<
        Array<string>
      >;

      if (!data) {
        return [];
      }

      const filteredData = filterNull(data);

      if (yesterdayDate) {
        matchResult = await this.constructMatchesResult(
          filteredData,
          competition,
          stage,
          config,
          yesterdayDate,
        );
      } else {
        matchResult = await this.constructMatchesResult(
          filteredData,
          competition,
          stage,
          config,
        );
      }

      return matchResult;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getCompetitionConfig(competition: string, stage: string) {
    try {
      const data = (await this.redisService.get('competition')) as Array<
        Array<string>
      >;

      if (!data) {
        this.logger.error(`Competition data is NULL in getCompetitionConfig`);

        throw new InternalServerErrorException();
      }

      const filteredData = filterNull(data);

      // remove header
      const dataWithoutHeader = [...filteredData.slice(1)];

      // store winner each group: index 3
      // wildcard taken each group: index 4
      // wildcard taken next stage: index 5
      let storeWinnerEachGroup: number;
      let wildcardTakenEachGroup: number;
      let wildcardTakenNextStage: number;

      for (const comp of dataWithoutHeader) {
        if (comp[1] === competition && comp[2] === stage) {
          storeWinnerEachGroup = +comp[3];
          wildcardTakenEachGroup = +comp[4];
          wildcardTakenNextStage = +comp[5];
        }
      }

      return {
        storeWinnerEachGroup,
        wildcardTakenEachGroup,
        wildcardTakenNextStage,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  setPrefixOnTeamResult(
    config: {
      storeWinnerEachGroup: number;
      wildcardTakenEachGroup: number;
      wildcardTakenNextStage: number;
    },
    teamIndex: number,
  ) {
    const storeWinners = config.storeWinnerEachGroup;
    const wildcards = config.wildcardTakenEachGroup;

    if (teamIndex < config.storeWinnerEachGroup) {
      return 'win';
    } else if (teamIndex < storeWinners + wildcards) {
      return 'wildcard';
    }

    return null;
  }

  async constructMatchesResult(
    data: Array<Array<string>>,
    competition: string,
    stage: string,
    config: {
      storeWinnerEachGroup: number;
      wildcardTakenEachGroup: number;
      wildcardTakenNextStage: number;
    },
    yesterdayDate?: string,
  ) {
    try {
      let filterDate: string;
      const header = data[0];

      const dataWithoutHeader = [...data.slice(1)];

      if (yesterdayDate) {
        filterDate = yesterdayDate;
      } else {
        filterDate = this.getFilterDate();
      }

      const assignedData = this.assignHeader(header, dataWithoutHeader);

      const teams = this.findTeam(assignedData);

      const filteredAssignedData = this.filterDataPrevBusinessDate(
        assignedData,
        filterDate,
      );

      // create team stats
      const teamStats: teamStat[] = [];
      for (const team of teams) {
        teamStats.push(this.createTeamStats(team));
      }

      // if there is no data based on filtered business date, then return team stat
      // this would likely happen in first day of matches
      // when every team does not have result yet
      if (!filteredAssignedData.length) {
        return teamStats;
      }

      this.assignWinner(filteredAssignedData, teamStats);
      this.assignLoser(filteredAssignedData, teamStats);
      this.assignTotalMatches(filteredAssignedData, teamStats);

      this.calculateTotalSalesAndTarget(filteredAssignedData, teamStats);

      if (REWARD_STAGE_BY_POSITION.includes(stage)) {
        const finalRewardConfig =
          await this.findIdrPerPointAndPartialGivenStagePosition(
            competition,
            stage,
          );

        const sorted = teamStats.slice().sort(this.sortByTotalPoint);

        // Set pref for each team based on index
        sorted.forEach((team, index) => {
          // only set prefix to team that already had a match
          if (team.totalMatches) {
            team.pref = this.setPrefixOnTeamResult(config, index);
          }
        });

        this.assignRewardByStagePosition(sorted, finalRewardConfig);

        return sorted;
      }

      // id per point per stage
      // count reward based on sum of point
      const idrPerPointAndPartialGiven =
        await this.findIdrPerPointAndPartialGiven(competition, stage);
      const idrPerPoint = +idrPerPointAndPartialGiven.idrPerPoint;
      const partialGivenPercentage = +idrPerPointAndPartialGiven.partialGiven;

      this.assignRewards(teamStats, idrPerPoint, partialGivenPercentage);

      const sorted = teamStats.slice().sort(this.sortByTotalPoint);

      // Set pref for each team based on index
      sorted.forEach((team, index) => {
        // only set prefix to team that already had a match
        if (team.totalMatches) {
          team.pref = this.setPrefixOnTeamResult(config, index);
        }
      });

      return sorted;
    } catch (error) {
      this.logger.error(`Error while construct match result ${error}`);
      throw new InternalServerErrorException();
    }
  }

  getFilterDate(): string {
    let filterDate: string;
    const timeZone = this.configService.get<string>('APP_TZ');

    // const serverTimeUTC = dayjs.utc('2024-03-19T22:00:00.987Z'); // server time in UTC, 22 PM UTC -> GMT +8 is 6 AM
    const serverTimeUTC = dayjs.utc(new Date());

    const localTime = dayjs.tz(serverTimeUTC, timeZone);

    const serverDate = serverTimeUTC.format('YYYY-MM-DD');
    const localDate = localTime.format('YYYY-MM-DD');

    const dayjsNow = dayjs(localDate).isAfter(serverDate);

    if (dayjsNow) {
      if (localTime.get('hour') >= STANDINGS_HOUR_PROCESS) {
        filterDate = localDate;
      } else {
        filterDate = serverDate;
      }
    } else {
      filterDate = serverDate;
    }

    this.logger.log(
      `FILTER DATE ${filterDate} TZ ${timeZone} UTC TIME ${serverTimeUTC}`,
    );

    return filterDate;
  }

  async findIdrPerPointAndPartialGivenStagePosition(
    competitionName: string,
    stage: string,
  ) {
    try {
      // find this in competition by competition and stage
      const competition = (await this.redisService.get('competition')) as Array<
        Array<string>
      >;

      if (!competition) {
        this.logger.error(
          `Competition is NULL in findIdrPerPointAndPartialGivenStagePosition`,
        );

        throw new InternalServerErrorException();
      }

      const filteredNull = filterNull(competition);

      let idrPerPointWinner: string;
      let idrPerPointLoser: string;
      let winnerPoint: string;
      let partialGivenWinner: string;
      let partialGivenLoser: string;
      let loserPoint: string;

      // find by header id
      const competitionId = `${competitionName}_${stage}`;

      // remove header
      const dataWithoutHeader = [...filteredNull.slice(1)];

      for (const c of dataWithoutHeader) {
        // competition id at index 0
        if (c[0] === competitionId) {
          //idr per point at index 16
          //partial given at index 15
          idrPerPointWinner = c[16];
          partialGivenWinner = c[15];
          winnerPoint = c[14];
          idrPerPointLoser = c[21];
          partialGivenLoser = c[20];
          loserPoint = c[19];
        }
      }

      return {
        idrPerPointWinner,
        partialGivenWinner,
        winnerPoint,
        idrPerPointLoser,
        partialGivenLoser,
        loserPoint,
      };
    } catch (error) {
      this.logger.error(
        `Error while findIdrPerPointAndPartialGivenStagePosition ${error}`,
      );
      throw new InternalServerErrorException();
    }
  }

  calculateTotalSalesAndTarget(
    filteredDataBusDate: matchResultType[],
    teamStat: teamStat[],
  ) {
    //
    const totalAchvRaw: totalAchvConstruct[] = [];
    for (const d of filteredDataBusDate) {
      totalAchvRaw.push({
        id: `${d.HomeId}`,
        team: d.Home,
        busDate: d.BusDate,
        sales: d.HomeIdrSales,
        target: d.HomeTarget,
      });
      totalAchvRaw.push({
        id: `${d.AwayId}`,
        team: d.Away,
        busDate: d.BusDate,
        sales: d.AwayIdrSales,
        target: d.AwayTarget,
      });
    }

    const uniqueDataSalesAndTarget = new Set(
      totalAchvRaw.map((item) => JSON.stringify(item)),
    );

    const uniqueDataArray = [...uniqueDataSalesAndTarget].map(
      (item): totalAchvConstruct => JSON.parse(item),
    );

    for (const team of teamStat) {
      for (const salesTarget of uniqueDataArray) {
        if (team.team === salesTarget.team) {
          team.totalSales += +salesTarget.sales;
          team.totalTarget += +salesTarget.target;
        }
      }
    }

    for (const team of teamStat) {
      const a = team.totalSales / team.totalTarget;
      team.totalAchv = isFinite(a) ? a : 0;
    }
  }

  assignRewardByStagePosition(
    teamStat: teamStat[],
    configReward: {
      idrPerPointWinner: string;
      partialGivenWinner: string;
      winnerPoint: string;
      idrPerPointLoser: string;
      partialGivenLoser: string;
      loserPoint: string;
    },
  ) {
    for (const team of teamStat) {
      if (team.pref === 'win') {
        team.totalReward =
          +configReward.idrPerPointWinner * +configReward.winnerPoint;
        team.totalPaid = +team.totalReward * +configReward.partialGivenWinner;
      } else {
        team.totalReward =
          +configReward.idrPerPointLoser * +configReward.loserPoint;
        team.totalPaid = +team.totalReward * +configReward.partialGivenLoser;
      }
    }
  }

  async findIdrPerPointAndPartialGiven(competitionName: string, stage: string) {
    try {
      // find this in competition by competition and stage
      const competition = (await this.redisService.get('competition')) as Array<
        Array<string>
      >;

      if (!competition) {
        this.logger.error(
          `Competition is NULL in findIdrPerPointAndPartialGiven`,
        );

        throw new InternalServerErrorException();
      }

      const filteredData = filterNull(competition);

      let idrPerPoint: string;
      let partialGiven: string;

      // find by header id
      const competitionId = `${competitionName}_${stage}`;

      // remove header
      const dataWithoutHeader = [...filteredData.slice(1)];

      for (const c of dataWithoutHeader) {
        // competition id at index 0
        if (c[0] === competitionId) {
          //idr per point at index 16
          //partial given at index 15
          idrPerPoint = c[16];
          partialGiven = c[15];
        }
      }

      return {
        idrPerPoint: idrPerPoint,
        partialGiven: partialGiven,
      };
    } catch (error) {
      this.logger.error(
        `Error while find idr per point and partial given ${error}`,
      );
      throw new InternalServerErrorException();
    }
  }

  filterDataPrevBusinessDate(data: matchResultType[], givenDate: string) {
    const filtered = data.filter((match) => {
      // BusDate can be null
      // filter match that only has a BusDate to be processed on match result standing
      if (match.BusDate) {
        const matchDate = new Date(match.BusDate);
        const givenDateObject = new Date(givenDate);
        return matchDate < givenDateObject;
      }
    });

    return filtered;
  }

  createTeamStats(teamName: string): teamStat {
    return {
      team: teamName,
      totalMatches: 0,
      totalPoint: 0,
      win: 0,
      lose: 0,
      totalReward: 0,
      totalPaid: 0,
      totalAchv: 0,
      totalSales: 0,
      totalTarget: 0,
      position: 0,
      pref: null,
      teamImg: null,
    };
  }

  findTeam(data: matchResultType[]) {
    const teams: string[] = [];
    for (const d of data) {
      teams.push(d.Home);
      teams.push(d.Away);
    }

    return new Set<string>(teams);
  }

  assignHeader(header: string[], data: Array<Array<string>>) {
    const arrayOfObjects = data.map((rowData) => {
      const object = {} as matchResultType;
      for (let i = 0; i < header.length; i++) {
        object[header[i]] = rowData[i];
      }
      return object;
    });

    return arrayOfObjects;
  }

  assignWinner(data: matchResultType[], teamStats: teamStat[]) {
    for (const d of data) {
      const winner = d.Winner;
      for (const stat of teamStats) {
        if (winner === stat.team) {
          stat.win += 1;
          stat.totalPoint += +d.PointCount;
        }
      }
    }
  }

  assignLoser(data: matchResultType[], teamStats: teamStat[]) {
    for (const d of data) {
      const loser = d.Loser;
      for (const stat of teamStats) {
        if (loser === stat.team) {
          stat.lose += 1;
        }
      }
    }
  }

  calculateTotalAchv(teamStat: teamStat[]) {
    for (const team of teamStat) {
      team.totalAchv = team.totalSales / team.totalTarget;
    }
  }

  assignTotalMatches(data: matchResultType[], teamStats: teamStat[]) {
    for (const d of data) {
      const home = d.Home;
      const away = d.Away;
      for (const stat of teamStats) {
        if (home === stat.team) {
          stat.totalMatches += 1;
        }

        if (away === stat.team) {
          stat.totalMatches += 1;
        }
      }
    }
  }

  assignRewards(
    teamStats: teamStat[],
    idrPerPoint: number,
    partialGivenPercentage: number,
  ) {
    for (const stat of teamStats) {
      stat.totalReward = idrPerPoint * stat.totalPoint;
      stat.totalPaid = stat.totalReward * partialGivenPercentage || 0;
    }
  }

  sortByTotalPoint(teamA: teamStat, teamB: teamStat) {
    // Prioritize higher totalPoint
    if (teamA.totalPoint !== teamB.totalPoint) {
      return teamB.totalPoint - teamA.totalPoint;
    }
    // If totalPoint is the same, prioritize higher achv
    return teamB.totalAchv - teamA.totalAchv;
  }

  async listMatches(competition: string, stage: string, group: string) {
    try {
      const matchesResultId = `Matchup-${competition}-${stage}-${group}`;
      const data = (await this.redisService.get(matchesResultId)) as Array<
        Array<string>
      >;

      if (!data) {
        return [];
      }

      const filteredData = filterNull(data);

      const result = await this.constructListMatches(filteredData);

      return result;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async constructListMatches(data: Array<Array<string>>) {
    try {
      let header = data[0];
      const dataWithoutHeader = [...data.slice(1)];

      header = header.filter((h) => h != null);

      const matches: matchType[] = [];
      const assignedData = this.assignHeader(header, dataWithoutHeader);

      // get latest sales update data
      const configData = (await this.redisService.get('config')) as Array<
        Array<string>
      >;

      if (!configData) {
        return [];
      }

      const filteredData = filterNull(configData);

      const salesUpdateTime = filteredData[5][1];

      for (const d of assignedData) {
        matches.push(this.createMatches(d));
      }

      const stores = await this.storeService.listStoreRedis();

      this.setStoreOwner(matches, stores);
      this.setSalesUpdateTime(matches, salesUpdateTime);

      // set approved status
      this.setApprovedStatus(matches, assignedData);

      // sort based on date asc
      matches.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      return matches;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  createMatches(data: matchResultType): matchType {
    return {
      team1: data.Home,
      team2: data.Away,
      date: data.BusDate || null,
      team1Achv: +data.HomePercent || 0,
      team2Achv: +data.AwayPercent || 0,
      am1: null,
      am2: null,
      ssh1: null,
      ssh2: null,
      sh1: null,
      sh2: null,
      team1ImageUrl: null,
      team2ImageUrl: null,
      salesUpdateTime: null,
      isApproved: 0,
    };
  }

  setSalesUpdateTime(matches: matchType[], salesUpdateTime: string) {
    for (const match of matches) {
      match.salesUpdateTime = salesUpdateTime;
    }
  }

  setApprovedStatus(matches: matchType[], data: matchResultType[]) {
    for (const match of matches) {
      for (const d of data) {
        if (
          match.team1 === d.Home &&
          match.team2 === d.Away &&
          d.Publish === '1'
        ) {
          match.isApproved = 1;
        }
      }
    }
  }

  setStoreOwner(matches: matchType[], stores: storeType[]) {
    for (const match of matches) {
      for (const store of stores) {
        if (match.team1 === store.code) {
          match.am1 = store.am;
          match.sh1 = store.sh;
          match.ssh1 = store.ssh;
          match.team1ImageUrl = store.imageUrl;
        }

        if (match.team2 === store.code) {
          match.am2 = store.am;
          match.sh2 = store.sh;
          match.ssh2 = store.ssh;
          match.team2ImageUrl = store.imageUrl;
        }
      }
    }
  }

  async wildcardMatchResult(competition: string, stage: string) {
    try {
      //TODO: find wildcard winner
      const config = await this.getCompetitionConfig(competition, stage);

      // find all group in this stage
      const groups = await this.groupService.listGroupRedis(competition, stage);
      const allStandings: teamStat[] = [];

      for (const group of groups) {
        const groupStanding = await this.matchResultStanding(
          competition,
          stage,
          group,
        );

        for (const g of groupStanding) {
          g.group = group;
        }

        allStandings.push(...groupStanding);
      }

      // filter only keep wildcard
      const wildcardStanding = this.filterOnlyKeepWildcard(allStandings);

      const sorted = wildcardStanding.slice().sort(this.sortByTotalPoint);

      sorted.forEach((team, index) => {
        // only set prefix to team that has a match
        if (team.totalMatches) {
          team.pref = this.setPrefixOnWildcardResult(config, index);
        }
      });

      return sorted;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  filterOnlyKeepWildcard(data: teamStat[]) {
    return data.filter((d) => d.pref === 'wildcard');
  }

  setPrefixOnWildcardResult(
    config: {
      wildcardTakenNextStage: number;
    },
    teamIndex: number,
  ) {
    const wildcardsNexStage = config.wildcardTakenNextStage;
    // const wildcardsNexStage = 2;

    if (teamIndex < wildcardsNexStage) {
      return 'lucky_wildcard';
    }

    return null;
  }

  async resultSummary(competition: string, stage: string) {
    try {
      // find all group in this stage
      const groups = await this.groupService.listGroupRedis(competition, stage);
      const allStandings: teamStat[] = [];

      for (const group of groups) {
        const groupStandingWinner = await this.matchesResultRedis(
          competition,
          stage,
          group,
        );

        for (const g of groupStandingWinner) {
          g.group = group;
        }

        allStandings.push(...groupStandingWinner);
      }

      const groupStandingLuckyWildcard = await this.wildcardMatchResult(
        competition,
        stage,
      );

      allStandings.push(...groupStandingLuckyWildcard);

      // take team with prefix
      // winner for winner each group
      // lucky_wildcard for winner in wildcard
      const matchSummary =
        this.filterOnlyKeepWinnerAndLuckyWildcard(allStandings);

      matchSummary.sort(this.sortByTotalPoint);

      return matchSummary;
    } catch (error) {
      this.logger.error(`Error while get result summary ${error}`);
      throw new InternalServerErrorException();
    }
  }

  filterOnlyKeepWinnerAndLuckyWildcard(data: teamStat[]) {
    return data.filter((d) => d.pref === 'lucky_wildcard' || d.pref === 'win');
  }

  async resultSummaryWithAllWildcard(competition: string, stage: string) {
    try {
      // find all group in this stage
      const groups = await this.groupService.listGroupRedis(competition, stage);
      const unfilteredWinnerStanding: teamStat[] = [];

      for (const group of groups) {
        const groupStandingWinner = await this.matchResultStanding(
          competition,
          stage,
          group,
        );

        for (const g of groupStandingWinner) {
          g.group = group;
        }

        unfilteredWinnerStanding.push(...groupStandingWinner);
      }

      // filter to only get win prefix
      const winnerStanding = unfilteredWinnerStanding.filter(
        (standing) => standing.pref === 'win',
      );

      const wildcardStanding = await this.wildcardMatchResult(
        competition,
        stage,
      );

      // sort all by total point and total achv
      winnerStanding.sort(this.sortByTotalPoint);
      wildcardStanding.sort(this.sortByTotalPoint);

      const allStandings: matchResultWithAllWildcard[] = [
        {
          name: 'groupWinner',
          teams: winnerStanding,
        },
        {
          name: 'wildcard',
          teams: wildcardStanding,
        },
      ];

      return allStandings;
    } catch (error) {
      this.logger.error(
        `Error while get result summary with all wildcard ${error}`,
      );
      throw new InternalServerErrorException();
    }
  }

  calculatePositionChange(
    currentStanding: teamStat[],
    previousStanding: teamStat[],
  ) {
    const previousStandingMap = new Map<string, number>(); // map team to their positions in previous standing

    for (let i = 0; i < previousStanding.length; i++) {
      previousStandingMap.set(previousStanding[i].team, i + 1); // positions are 1-based, index 0 position 1
    }

    // calculate posisition change
    for (let i = 0; i < currentStanding.length; i++) {
      const currentTeam = currentStanding[i];
      const previousPosition = previousStandingMap.get(currentTeam.team);

      currentTeam.position = previousPosition
        ? previousPosition - (i + 1) // calculate difference (up: positive, down: negative)
        : 99999999999; // no previous position information
    }

    return currentStanding;
  }

  async getAllResultStanding(competition: string, stage: string) {
    try {
      const groups = await this.groupService.listGroupRedis(competition, stage);
      const allStandingGroupResult: matchResultWithAllWildcard[] = [];

      for (const group of groups) {
        const standing = (
          await this.matchResultStanding(competition, stage, group)
        ).map((d) => ({
          ...d,
          group: group,
        }));

        allStandingGroupResult.push({
          name: group,
          teams: [...standing],
        });
      }

      return allStandingGroupResult;
    } catch (error) {
      this.logger.error(`Error while get all result standing`);
      throw new InternalServerErrorException();
    }
  }

  // async storeOwnerRewards(competition: string, stage: string) {
  //   try {
  //     const matchSummaryResult = await this.resultSummary(competition, stage);

  //     const x = matchSummaryResult.map(
  //       (y) =>
  //         ({
  //           ...y,
  //           am: null,
  //           ssh: null,
  //           sh: null,
  //         } satisfies matchResultSummaryOwner),
  //     );

  //     const stores = await this.storeService.listStoreRedis();

  //     for (const match of x) {
  //       for (const store of stores) {
  //         if (match.team === store.code) {
  //           match.am = store.am;
  //           match.ssh = store.ssh;
  //           match.sh = store.sh;
  //         }
  //       }
  //     }

  //     return x;
  //   } catch (error) {
  //     throw new InternalServerErrorException();
  //   }
  // }

  ////////////////////v2//////////////////////
  // include result of last 5 match
  async matchResultStandingV2(
    competition: string,
    stage: string,
    group: string,
    isAdmin?: boolean,
  ) {
    try {
      const tz = this.configService.get<string>('APP_TZ');
      const yesterday = dayjs.tz(this.getFilterDate(), tz).subtract(1, 'day');
      const yesterdayDate = yesterday.format('YYYY-MM-DD');

      const currentMatchResult = await this.matchesResultRedisV2(
        competition,
        stage,
        group,
        null,
        isAdmin,
      );

      const prevMatchResult = await this.matchesResultRedisV2(
        competition,
        stage,
        group,
        yesterdayDate,
        isAdmin,
      );

      const updatedCurrentStanding = this.calculatePositionChange(
        currentMatchResult.slice(),
        prevMatchResult.slice(),
      );

      return updatedCurrentStanding;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async matchesResultRedisV2(
    competition: string,
    stage: string,
    group: string,
    yesterdayDate?: string,
    isAdmin?: boolean,
  ) {
    try {
      let matchResult: teamStat[];
      const config = await this.getCompetitionConfig(competition, stage);

      const matchesResultId = `Matchup-${competition}-${stage}-${group}`;
      const data = (await this.redisService.get(matchesResultId)) as Array<
        Array<string>
      >;

      if (!data) {
        return [];
      }

      const filteredData = filterNull(data);

      if (yesterdayDate) {
        matchResult = await this.constructMatchesResultV2(
          filteredData,
          competition,
          stage,
          config,
          yesterdayDate,
          isAdmin,
        );
      } else {
        matchResult = await this.constructMatchesResultV2(
          filteredData,
          competition,
          stage,
          config,
          null,
          isAdmin,
        );
      }

      // get match played by store
      const x = await this.getMatchPlayedData(
        filteredData,
        matchResult,
        isAdmin,
      );

      return x;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async constructMatchesResultV2(
    data: Array<Array<string>>,
    competition: string,
    stage: string,
    config: {
      storeWinnerEachGroup: number;
      wildcardTakenEachGroup: number;
      wildcardTakenNextStage: number;
    },
    yesterdayDate?: string,
    isAdmin?: boolean,
  ) {
    try {
      let filterDate: string;
      const header = data[0];

      const dataWithoutHeader = [...data.slice(1)];

      if (yesterdayDate) {
        filterDate = yesterdayDate;
      } else {
        filterDate = this.getFilterDate();
      }

      const assignedData = this.assignHeader(header, dataWithoutHeader);

      const publishData = isAdmin
        ? assignedData
        : this.filterOnlyPublished(assignedData);

      const teams = this.findTeam(assignedData);

      const filteredAssignedData = this.filterDataPrevBusinessDate(
        publishData,
        filterDate,
      );

      // create team stats
      const teamStats: teamStat[] = [];
      for (const team of teams) {
        teamStats.push(this.createTeamStats(team));
      }

      // if there is no data based on filtered business date, then return team stat
      // this would likely happen in first day of matches
      // when every team does not have result yet
      if (!filteredAssignedData.length) {
        return teamStats;
      }

      this.assignWinner(filteredAssignedData, teamStats);
      this.assignLoser(filteredAssignedData, teamStats);
      this.assignTotalMatches(filteredAssignedData, teamStats);

      // assign team images
      const stores = await this.storeService.listStoreRedis();
      this.assignTeamImages(teamStats, stores);

      this.calculateTotalSalesAndTarget(filteredAssignedData, teamStats);

      if (REWARD_STAGE_BY_POSITION.includes(stage)) {
        const finalRewardConfig =
          await this.findIdrPerPointAndPartialGivenStagePosition(
            competition,
            stage,
          );

        const sorted = teamStats.slice().sort(this.sortByTotalPoint);

        // Set pref for each team based on index
        sorted.forEach((team, index) => {
          // only set prefix to team that already had a match
          if (team.totalMatches) {
            team.pref = this.setPrefixOnTeamResult(config, index);
          }
        });

        this.assignRewardByStagePosition(sorted, finalRewardConfig);

        return sorted;
      }

      // id per point per stage
      // count reward based on sum of point
      const idrPerPointAndPartialGiven =
        await this.findIdrPerPointAndPartialGiven(competition, stage);
      const idrPerPoint = +idrPerPointAndPartialGiven.idrPerPoint;
      const partialGivenPercentage = +idrPerPointAndPartialGiven.partialGiven;

      this.assignRewards(teamStats, idrPerPoint, partialGivenPercentage);

      const sorted = teamStats.slice().sort(this.sortByTotalPoint);

      // Set pref for each team based on index
      sorted.forEach((team, index) => {
        // only set prefix to team that already had a match
        if (team.totalMatches) {
          team.pref = this.setPrefixOnTeamResult(config, index);
        }
      });

      return sorted;
    } catch (error) {
      this.logger.error(`Error while construct match result ${error}`);
      throw new InternalServerErrorException();
    }
  }

  assignTeamImages(teams: teamStat[], stores: storeType[]) {
    for (const team of teams) {
      for (const store of stores) {
        if (team.team === store.code) {
          team.teamImg = store.imageUrl;
        }
      }
    }
  }

  async getMatchPlayedData(
    data: Array<Array<string>>,
    stat: teamStat[],
    isAdmin?: boolean,
  ): Promise<Array<teamStatV2>> {
    try {
      const header = data[0];

      const dataWithoutHeader = [...data.slice(1)];

      const assignedData = this.assignHeader(header, dataWithoutHeader);

      const publishData = isAdmin
        ? assignedData
        : this.filterOnlyPublished(assignedData);

      const updatedStats = stat.map((team) => {
        const matchesPlayed = publishData
          .filter(
            (match) => match.Home === team.team || match.Away === team.team,
          )
          .sort(
            (a, b) =>
              new Date(b.BusDate).getTime() - new Date(a.BusDate).getTime(),
          );

        const matchDetails = matchesPlayed.map((match) => {
          const opponent = match.Home === team.team ? match.Away : match.Home;
          const isWinner = match.Winner === team.team;
          const date = match.BusDate;

          const teamAchv =
            match.Home === team.team ? match.HomePercent : match.AwayPercent;
          const opponentAchv =
            match.Home === team.team ? match.AwayPercent : match.HomePercent;

          return {
            team: team.team,
            opponent,
            teamAchv,
            opponentAchv,
            isWinner,
            date,
          };
        });

        return {
          ...team,
          matchPlayed: matchDetails,
        };
      });

      return updatedStats;
    } catch (error) {
      this.logger.error(error);

      throw error;
    }
  }

  async listTeamMatches(
    competition: string,
    stage: string,
    group: string,
    team: string,
    isAdmin?: boolean,
  ) {
    try {
      const matchesResultId = `Matchup-${competition}-${stage}-${group}`;
      const data = (await this.redisService.get(matchesResultId)) as Array<
        Array<string>
      >;

      if (!data) {
        return [];
      }

      const filteredData = filterNull(data);

      const result = await this.constructTeamMatches(
        filteredData,
        team,
        isAdmin,
      );

      return result;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async constructTeamMatches(
    data: Array<Array<string>>,
    team: string,
    isAdmin?: boolean,
  ) {
    try {
      const header = data[0];
      const dataWithoutHeader = [...data.slice(1)];

      const matches: matchType[] = [];
      const assignedData = this.assignHeader(header, dataWithoutHeader);

      const publishData = isAdmin
        ? assignedData
        : this.filterOnlyPublished(assignedData);

      // filter team matches
      const teamMatches = this.filterTeamMatches(publishData, team);

      // get latest sales update data
      const configData = (await this.redisService.get('config')) as Array<
        Array<string>
      >;

      if (!configData) {
        return [];
      }

      const filteredData = filterNull(configData);

      const salesUpdateTime = filteredData[5][1];

      for (const d of teamMatches) {
        matches.push(this.createMatches(d));
      }

      const stores = await this.storeService.listStoreRedis();

      this.setStoreOwner(matches, stores);
      this.setSalesUpdateTime(matches, salesUpdateTime);

      // set approved status
      this.setApprovedStatus(matches, assignedData);

      // sort based on date asc
      matches.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      return matches;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  filterTeamMatches(data: matchResultType[], team: string) {
    const teamMatches = data.filter(
      (match) => match.Home === team || match.Away === team,
    );

    return teamMatches;
  }

  // async listMatchesClient(competition: string, stage: string, group: string) {
  //   try {
  //     const matchesResultId = `Matchup-${competition}-${stage}-${group}`;
  //     const data = (await this.redisService.get(matchesResultId)) as Array<
  //       Array<string>
  //     >;

  //     if (!data) {
  //       return [];
  //     }

  //     const filteredData = filterNull(data);

  //     const result = await this.constructListMatchesClient(filteredData);

  //     return result;
  //   } catch (error) {
  //     this.logger.error(error);

  //     throw new InternalServerErrorException();
  //   }
  // }

  // /**
  //  * this method is purposed to be show in client
  //  * we give admin an advantage of approved home and away idr sales to adjust sales of a team in a match
  //  * in client we only show match result that has approved home and away idr sales
  //  */
  // async constructListMatchesClient(data: Array<Array<string>>) {
  //   try {
  //     const header = data[0];
  //     const dataWithoutHeader = [...data.slice(1)];

  //     const matches: matchType[] = [];
  //     const assignedData = this.assignHeader(header, dataWithoutHeader);

  //     // get latest sales update data
  //     const configData = (await this.redisService.get('config')) as Array<
  //       Array<string>
  //     >;

  //     if (!configData) {
  //       return [];
  //     }

  //     const filteredData = filterNull(configData);

  //     const salesUpdateTime = filteredData[5][1];

  //     for (const d of assignedData) {
  //       matches.push(this.createMatches(d));
  //     }

  //     const stores = await this.storeService.listStoreRedis();

  //     this.setStoreOwner(matches, stores);
  //     this.setSalesUpdateTime(matches, salesUpdateTime);

  //     // sort based on date asc
  //     matches.sort(
  //       (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  //     );

  //     return matches;
  //   } catch (error) {
  //     this.logger.error(error);
  //     throw new InternalServerErrorException();
  //   }
  // }

  /**
   * this method mainly use for match result list for CLIENT
   * @param data Array<matchResultType>
   * @returns Array<matchResultType>
   */
  filterOnlyPublished(data: matchResultType[]) {
    const dataWithApprovedIdrValue = data.filter((d) => {
      return d.Publish !== undefined && d.Publish == '1';
    });

    return dataWithApprovedIdrValue;
  }
}
