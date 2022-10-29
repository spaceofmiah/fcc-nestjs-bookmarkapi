import { Injectable, ForbiddenException } from '@nestjs/common';
import { Bookmark } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto'


@Injectable()
export class BookmarkService {

	constructor(private prisma:PrismaService) { }

	async createBookmark(userId: number, dto: CreateBookmarkDto) {
		const bookmark = await this.prisma.bookmark.create({
			data: {
				userId: userId,
				...dto
			}
		})

		return bookmark
	}

	getBookmarks(userId: number) {
		return this.prisma.bookmark.findMany({where: { userId }});
	}
	
	getBookmarkById(userId: number, bookmarkId: number) {
		return this.prisma.bookmark.findFirst(
			{where: { 
				id: bookmarkId,
				userId, 
			}
		});
	}
	
	async editBookmarkById(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
		// get bookmark by id
		const bookmark:Bookmark = await this.prisma.bookmark.findUnique({
			where: { id: bookmarkId }
		})

		// check if user owns the id
		if (!bookmark || bookmark.userId !== userId)
			throw new ForbiddenException(
				'Access to resource denied'
			)

		// update the bookmark
		return this.prisma.bookmark.update({
			where:{ id: bookmarkId },
			data: { ...dto }
		})
	}
 	
	async deleteBookmarkById(userId: number, bookmarkId: number) {
		// get bookmark by id
		const bookmark:Bookmark = await this.prisma.bookmark.findUnique({
			where: { id: bookmarkId }
		})

		// check if user owns the id
		if (!bookmark || bookmark.userId !== userId)
			throw new ForbiddenException(
				'Access to resource denied'
			)

		await this.prisma.bookmark.delete({
			where: {
				id: bookmarkId
			}
		})
	}
}
